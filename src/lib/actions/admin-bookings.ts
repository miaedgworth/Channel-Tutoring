"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDate, formatLevel, formatTokenQuantity } from "@/lib/utils";
import { PLATFORM_FEE_PENCE, LEVEL_PRICE_PENCE, formatSessionDuration } from "@/lib/constants";
import {
  adminScheduleSessionSchema,
  type AdminScheduleSessionInput,
} from "@/lib/validations/schedule-lesson";

export async function adminScheduleSession(
  input: AdminScheduleSessionInput,
): Promise<{ error: string; bookingId?: undefined } | { error?: undefined; bookingId: string }> {
  const admin = await requireUser("ADMIN");
  const parsed = adminScheduleSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientId, tutorProfileId, subject, level, examBoard, sessionMode, date, notes, durationMinutes } =
    parsed.data;

  const [client, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId } }),
    prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };
  if (!profile) return { error: "Tutor not found." };
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    return {
      error: `${profile.user.name} only offers ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`,
    };
  }

  const tokensUsed = durationMinutes / 60;
  const pricePence = Math.round(LEVEL_PRICE_PENCE[level] * tokensUsed);
  const platformFeePence = Math.round(PLATFORM_FEE_PENCE * tokensUsed);
  const tutorPayoutPence = pricePence - platformFeePence;
  const startsAt = date;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      const tokenBalance = await tx.tokenBalance.findUnique({
        where: { userId_level: { userId: clientId, level } },
      });
      if (!tokenBalance || Number(tokenBalance.balance) < tokensUsed) {
        throw new Error(
          `${client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Grant them tokens first, or reduce the session length.`,
        );
      }

      await tx.tokenBalance.update({
        where: { id: tokenBalance.id },
        data: { balance: { decrement: tokensUsed } },
      });
      await tx.tokenTransaction.create({
        data: {
          userId: clientId,
          level,
          type: "REDEEM",
          quantity: -tokensUsed,
          description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled with ${profile.user.name} for ${formatDate(startsAt)} by Channel Tutoring`,
        },
      });

      const created = await tx.booking.create({
        data: {
          clientId,
          tutorId: profile.id,
          subject,
          level,
          examBoard: examBoard || null,
          sessionMode,
          startsAt,
          endsAt,
          tokensUsed,
          pricePence,
          platformFeePence,
          tutorPayoutPence,
          notes: notes || null,
          status: "CONFIRMED",
        },
      });

      await tx.payment.create({
        data: {
          bookingId: created.id,
          amountPence: pricePence,
          platformFeePence,
          tutorAmountPence: tutorPayoutPence,
          status: "PENDING",
        },
      });

      return created;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  await logAudit({
    actorId: admin.id,
    action: "ADMIN_SESSION_SCHEDULED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { clientId, tutorProfileId, level, tokensUsed },
  });

  await Promise.all([
    sendEmail({
      to: client.email,
      subject: "A session has been scheduled on Channel Tutoring",
      html: baseEmailLayout(`
        <p>Hi ${client.name},</p>
        <p>Channel Tutoring has scheduled a ${formatSessionDuration(durationMinutes)}
        ${subject} session for you with ${profile.user.name} on
        ${formatDate(startsAt)}, using ${formatTokenQuantity(tokensUsed)}
        of your ${formatLevel(level)} tokens. You'll see this under
        Upcoming Sessions on your dashboard.</p>
        <p>If this doesn't look right, reply to this email or
        <a href="mailto:info@channeltutoring.com">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "Session scheduled",
      html: baseEmailLayout(`
        <p>Hi ${profile.user.name},</p>
        <p>Channel Tutoring has scheduled a ${subject} session for you
        with ${client.name} on ${formatDate(startsAt)}. Once you've
        taught it, mark it as complete in your dashboard to get paid.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/admin/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/tutor-dashboard");

  return { bookingId: booking.id };
}
