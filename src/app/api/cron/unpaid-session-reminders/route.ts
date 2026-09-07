import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml, formatLevel, formatTime, toLocalDateInputValue, londonWallTimeToUtc } from "@/lib/utils";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayLondon = toLocalDateInputValue(new Date());
  const dayStart = londonWallTimeToUtc(todayLondon, "00:00");
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const unpaid = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      tokensReserved: false,
      paymentReminderSentAt: null,
      startsAt: { gte: dayStart, lt: dayEnd },
    },
    orderBy: { startsAt: "asc" },
    include: {
      client: { select: { id: true, name: true, email: true } },
      tutor: { include: { user: { select: { name: true } } } },
    },
  });

  // Group by client so someone with more than one unpaid session today
  // gets a single email, not one per session.
  const groups = new Map<
    string,
    { client: { id: string; name: string; email: string }; bookingIds: string[]; lines: string[] }
  >();
  for (const booking of unpaid) {
    const existing = groups.get(booking.client.id);
    const line = `${escapeHtml(booking.subject)} (${formatLevel(booking.level)}) with ${escapeHtml(booking.tutor.user.name)} at ${formatTime(booking.startsAt)}`;
    if (existing) {
      existing.bookingIds.push(booking.id);
      existing.lines.push(line);
    } else {
      groups.set(booking.client.id, {
        client: booking.client,
        bookingIds: [booking.id],
        lines: [line],
      });
    }
  }

  const results = await Promise.allSettled(
    Array.from(groups.values()).map(async (group) => {
      // Claim before sending — the conditional update only affects rows
      // still unclaimed, so an overlapping run can't double-send.
      const claimed = await prisma.booking.updateMany({
        where: { id: { in: group.bookingIds }, paymentReminderSentAt: null },
        data: { paymentReminderSentAt: new Date() },
      });
      if (claimed.count === 0) return false;

      await sendEmail({
        to: group.client.email,
        subject:
          claimed.count > 1
            ? "You have unpaid sessions today on Channel Tutoring"
            : "Your session today isn't paid for yet",
        html: baseEmailLayout(`
          <p>Hi ${escapeHtml(group.client.name)},</p>
          <p>${claimed.count > 1 ? "You have sessions" : "You have a session"} today that
          ${claimed.count > 1 ? "haven't" : "hasn't"} been paid for yet:</p>
          <ul>
            ${group.lines.map((line) => `<li>${line}</li>`).join("")}
          </ul>
          <p>Please add tokens to your account as soon as you can so
          today's session${claimed.count > 1 ? "s go" : " goes"} ahead as planned.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>
        `),
      });
      return true;
    }),
  );

  const remindersSent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ remindersSent, bookingsChecked: unpaid.length });
}
