"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDate, formatCurrencyGBP, formatLevel } from "@/lib/utils";
import {
  PLATFORM_FEE_PENCE,
  LEVEL_PRICE_PENCE,
  TOKEN_LESSON_DURATION_MINUTES,
  LESSON_LOG_UNDO_WINDOW_MS,
} from "@/lib/constants";
import {
  logCompletedLessonSchema,
  type LogCompletedLessonInput,
} from "@/lib/validations/schedule-lesson";

export async function logCompletedLesson(input: LogCompletedLessonInput) {
  const user = await requireUser("TUTOR");
  const parsed = logCompletedLessonSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { clientId, subject, level, examBoard, sessionMode, date, notes } = parsed.data;

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!profile) throw new Error("Tutor profile not found.");
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    throw new Error(`You only offer ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`);
  }

  // Only allow logging lessons for clients the tutor already has a
  // conversation with, so this can't be used against arbitrary users.
  const conversation = await prisma.conversation.findUnique({
    where: { clientId_tutorProfileId: { clientId, tutorProfileId: profile.id } },
    include: { client: true },
  });
  if (!conversation) {
    throw new Error("You can only log lessons for clients you're already messaging.");
  }

  const pricePence = LEVEL_PRICE_PENCE[level];
  const tutorPayoutPence = pricePence - PLATFORM_FEE_PENCE;
  const startsAt = date;
  const endsAt = new Date(startsAt.getTime() + TOKEN_LESSON_DURATION_MINUTES * 60 * 1000);

  const booking = await prisma.$transaction(async (tx) => {
    const tokenBalance = await tx.tokenBalance.findUnique({
      where: { userId_level: { userId: clientId, level } },
    });
    if (!tokenBalance || tokenBalance.balance < 1) {
      throw new Error(
        `${conversation.client.name} doesn't have any ${formatLevel(level)} tokens left. Ask them to buy more before you log this lesson.`,
      );
    }

    await tx.tokenBalance.update({
      where: { id: tokenBalance.id },
      data: { balance: { decrement: 1 } },
    });
    await tx.tokenTransaction.create({
      data: {
        userId: clientId,
        level,
        type: "REDEEM",
        quantity: -1,
        description: `${subject} lesson with ${profile.user.name} on ${formatDate(startsAt)}`,
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
        pricePence,
        platformFeePence: PLATFORM_FEE_PENCE,
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
        platformFeePence: PLATFORM_FEE_PENCE,
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

  await logAudit({
    actorId: user.id,
    action: "LESSON_LOGGED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { clientId, level },
  });

  await Promise.all([
    sendEmail({
      to: conversation.client.email,
      subject: "A lesson has been logged on Channel Tutoring",
      html: baseEmailLayout(`
        <p>Hi ${conversation.client.name},</p>
        <p>${profile.user.name} logged your ${subject} lesson on
        ${formatDate(startsAt)} as complete, using 1 of your
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

  return booking.id;
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const user = await requireUser("TUTOR");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true, client: true, payment: true },
  });
  if (!booking || booking.tutor.userId !== user.id) throw new Error("Booking not found.");
  if (booking.status !== "COMPLETED") throw new Error("This lesson log can't be undone.");
  if (!booking.completedAt || Date.now() - booking.completedAt.getTime() > LESSON_LOG_UNDO_WINDOW_MS) {
    throw new Error("This lesson was logged more than 24 hours ago and can no longer be undone.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.tokenBalance.upsert({
      where: { userId_level: { userId: booking.clientId, level: booking.level } },
      create: { userId: booking.clientId, level: booking.level, balance: 1 },
      update: { balance: { increment: 1 } },
    });
    await tx.tokenTransaction.create({
      data: {
        userId: booking.clientId,
        level: booking.level,
        type: "REFUND",
        quantity: 1,
        bookingId: booking.id,
        description: `Token refunded — ${booking.subject} lesson on ${formatDate(booking.startsAt)} was undone by your tutor`,
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
}
