import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml, formatCurrency, formatDate, toLocalDateInputValue, regionWallTimeToUtc } from "@/lib/utils";

// Runs daily. Once a course's balance due date has arrived, any enrolment
// that's paid its deposit but not yet the balance gets a one-off email
// with a link to pay it from their dashboard — they can also pay early at
// any time without waiting for this. balanceReminderSentAt guards against
// emailing the same enrolment twice.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayEnd = new Date(
    regionWallTimeToUtc(toLocalDateInputValue(new Date()), "00:00").getTime() + 24 * 60 * 60 * 1000,
  );

  const due = await prisma.courseEnrollment.findMany({
    where: {
      depositStatus: "PAID",
      balanceStatus: "PENDING",
      balanceReminderSentAt: null,
      course: { balanceDueDate: { lt: todayEnd } },
    },
    include: { course: true, client: { select: { name: true, email: true } } },
  });

  const results = await Promise.allSettled(
    due.map(async (enrollment) => {
      const contactEmail = enrollment.client?.email ?? enrollment.guestEmail;
      const contactName = enrollment.client?.name ?? enrollment.guestName ?? "there";
      if (!contactEmail) return false;

      const claimed = await prisma.courseEnrollment.updateMany({
        where: { id: enrollment.id, balanceReminderSentAt: null },
        data: { balanceReminderSentAt: new Date() },
      });
      if (claimed.count === 0) return false;

      const payLink = enrollment.clientId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses`
        : `${process.env.NEXT_PUBLIC_APP_URL}/courses/pay-balance/${enrollment.id}`;

      await sendEmail({
        to: contactEmail,
        subject: `Balance due — ${enrollment.course.title}`,
        html: baseEmailLayout(`
          <p>Hi ${escapeHtml(contactName)},</p>
          <p>The remaining balance of ${formatCurrency(enrollment.balancePence)} for
          ${escapeHtml(enrollment.childName)}'s place on
          <strong>${escapeHtml(enrollment.course.title)}</strong> is now due
          ${enrollment.course.balanceDueDate ? `(due ${formatDate(enrollment.course.balanceDueDate)})` : ""}.</p>
          <p><a href="${payLink}" style="color:#C9A227;font-weight:bold;">Pay the balance</a></p>
        `),
      });
      return true;
    }),
  );

  const remindersSent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ enrollmentsChecked: due.length, remindersSent });
}
