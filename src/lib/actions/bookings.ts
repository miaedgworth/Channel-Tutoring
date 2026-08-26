"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDate, formatCurrencyGBP, formatLevel, formatTokenQuantity } from "@/lib/utils";
import {
  PLATFORM_FEE_PENCE,
  LEVEL_PRICE_PENCE,
  LESSON_LOG_UNDO_WINDOW_MS,
  formatSessionDuration,
} from "@/lib/constants";
import {
  logCompletedLessonSchema,
  type LogCompletedLessonInput,
} from "@/lib/validations/schedule-lesson";

export async function logCompletedLesson(
  input: LogCompletedLessonInput,
): Promise<{ error: string; bookingId?: undefined } | { error?: undefined; bookingId: string }> {
  const user = await requireUser("TUTOR");
  const parsed = logCompletedLessonSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientId, subject, level, examBoard, sessionMode, date, notes, durationMinutes } =
    parsed.data;

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) return { error: "Tutor profile not found." };
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    return {
      error: `You only offer ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`,
    };
  }

  // Only allow logging lessons for clients the tutor already has a
  // conversation with, so this can't be used against arbitrary users.
  const conversation = await prisma.conversation.findUnique({
    where: { clientId_tutorProfileId: { clientId, tutorProfileId: profile.id } },
    include: { client: true },
  });
  if (!conversation) {
    return { error: "You can only log lessons for clients you're already messaging." };
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
        `${conversation.client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Ask them to buy more before you log this lesson.`,
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
        description: `${subject} lesson (${formatSessionDuration(durationMinutes)}) with ${profile.user.name} on ${formatDate(startsAt)}`,
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
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    await tx.payment.create({
      data: {
        bookingId: created.id,
        amountPence: pricePence,
        platformFeePence,
        tutorAmountPence: tutorPayoutPence,
        status: "SUCCEEDED",
      },
    });
    await tx.tutorProfile.update({
      where: { id: profile.id },
      data: {
        balancePence: { increment: tutorPayoutPence },
        totalEarnedPence: { increment: tutorPayoutPence },
      },
    });
    await tx.tutorLedgerEntry.create({
      data: {
        tutorId: profile.id,
        type: "EARNING",
        amountPence: tutorPayoutPence,
        bookingId: created.id,
        description: `${subject} lesson with ${conversation.client.name} on ${formatDate(startsAt)}`,
      },
    });

    return created;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  await logAudit({
    actorId: user.id,
    action: "LESSON_LOGGED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { clientId, level, tokensUsed },
  });

  await Promise.all([
    sendEmail({
      to: conversation.client.email,
      subject: "A lesson has been logged on Channel Tutoring",
      html: baseEmailLayout(`
        <p>Hi ${conversation.client.name},</p>
        <p>${profile.user.name} logged your ${formatSessionDuration(durationMinutes)}
        ${subject} lesson on ${formatDate(startsAt)} as complete, using
        ${formatTokenQuantity(tokensUsed)} of your
        ${formatLevel(level)} tokens.</p>
        <p>If this doesn't look right, reply to your tutor or
        <a href="mailto:info@channeltutoring.com">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "Lesson logged — you've been paid",
      html: baseEmailLayout(`
        <p>Hi ${profile.user.name},</p>
        <p>Your ${subject} lesson with ${conversation.client.name} on
        ${formatDate(startsAt)} has been logged &mdash; payout
        ${formatCurrencyGBP(tutorPayoutPence)}.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/earnings");

  return { bookingId: booking.id };
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true, client: true, payment: true },
  });
  if (!booking || booking.tutor.userId !== user.id) return { error: "Booking not found." };
  if (booking.status !== "COMPLETED") return { error: "This lesson log can't be undone." };
  if (!booking.completedAt || Date.now() - booking.completedAt.getTime() > LESSON_LOG_UNDO_WINDOW_MS) {
    return { error: "This lesson was logged more than 24 hours ago and can no longer be undone." };
  }

  const tokensUsed = booking.tokensUsed;

  await prisma.$transaction(async (tx) => {
    await tx.tokenBalance.upsert({
      where: { userId_level: { userId: booking.clientId, level: booking.level } },
      create: { userId: booking.clientId, level: booking.level, balance: tokensUsed },
      update: { balance: { increment: tokensUsed } },
    });
    await tx.tokenTransaction.create({
      data: {
        userId: booking.clientId,
        level: booking.level,
        type: "REFUND",
        quantity: tokensUsed,
        bookingId: booking.id,
        description: `${formatTokenQuantity(tokensUsed)} token(s) refunded — ${booking.subject} lesson on ${formatDate(booking.startsAt)} was undone by your tutor`,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED_BY_TUTOR",
        cancellationReason: reason || null,
        cancelledAt: new Date(),
      },
    });

    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED", refundedPence: booking.payment.amountPence },
      });
    }
    await tx.tutorProfile.update({
      where: { id: booking.tutorId },
      data: {
        balancePence: { decrement: booking.tutorPayoutPence },
        totalEarnedPence: { decrement: booking.tutorPayoutPence },
      },
    });
    await tx.tutorLedgerEntry.create({
      data: {
        tutorId: booking.tutorId,
        type: "REFUND",
        amountPence: -booking.tutorPayoutPence,
        bookingId: booking.id,
        description: `Lesson log undone — ${booking.subject} on ${formatDate(booking.startsAt)}`,
      },
    });
  });

  await logAudit({
    actorId: user.id,
    action: "LESSON_LOG_UNDONE",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { reason: reason ?? null },
  });

  await sendEmail({
    to: booking.client.email,
    subject: "A logged lesson was undone",
    html: baseEmailLayout(`
      <p>Hi ${booking.client.name},</p>
      <p>${booking.tutor.userId === user.id ? "Your tutor" : "Channel Tutoring"}
      undid the ${booking.subject} lesson logged for
      ${formatDate(booking.startsAt)} &mdash; your token has been refunded.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
    `),
  }).catch(() => {});

  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);

  return {};
}
