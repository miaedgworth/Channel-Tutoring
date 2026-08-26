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
  scheduleSessionSchema,
  updateSessionSchema,
  type LogCompletedLessonInput,
  type ScheduleSessionInput,
  type UpdateSessionInput,
} from "@/lib/validations/schedule-lesson";

export async function scheduleSession(
  input: ScheduleSessionInput,
): Promise<{ error: string; bookingId?: undefined } | { error?: undefined; bookingId: string }> {
  const user = await requireUser("TUTOR");
  const parsed = scheduleSessionSchema.safeParse(input);
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

  // Only allow scheduling sessions for clients the tutor already has a
  // conversation with, so this can't be used against arbitrary users.
  const conversation = await prisma.conversation.findUnique({
    where: { clientId_tutorProfileId: { clientId, tutorProfileId: profile.id } },
    include: { client: true },
  });
  if (!conversation) {
    return { error: "You can only schedule sessions for clients you're already messaging." };
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
      // Atomic conditional decrement — the WHERE clause is re-checked
      // against the row's committed value even under a concurrent
      // transaction, so two simultaneous schedules against the same
      // almost-exhausted balance can't both succeed and drive it negative.
      const claimed = await tx.tokenBalance.updateMany({
        where: { userId: clientId, level, balance: { gte: tokensUsed } },
        data: { balance: { decrement: tokensUsed } },
      });
      if (claimed.count === 0) {
        throw new Error(
          `${conversation.client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Ask them to buy more before you schedule this.`,
        );
      }
      await tx.tokenTransaction.create({
        data: {
          userId: clientId,
          level,
          type: "REDEEM",
          quantity: -tokensUsed,
          description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled with ${profile.user.name} for ${formatDate(startsAt)}`,
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
    actorId: user.id,
    action: "SESSION_SCHEDULED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { clientId, level, tokensUsed },
  });

  await Promise.all([
    sendEmail({
      to: conversation.client.email,
      subject: "A session has been scheduled on Channel Tutoring",
      html: baseEmailLayout(`
        <p>Hi ${conversation.client.name},</p>
        <p>${profile.user.name} has scheduled a ${formatSessionDuration(durationMinutes)}
        ${subject} session with you on ${formatDate(startsAt)}, using
        ${formatTokenQuantity(tokensUsed)} of your
        ${formatLevel(level)} tokens. You'll see this under Upcoming
        Sessions on your dashboard.</p>
        <p>If this doesn't look right, reply to your tutor or
        <a href="mailto:info@channeltutoring.com">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "Session scheduled",
      html: baseEmailLayout(`
        <p>Hi ${profile.user.name},</p>
        <p>Your ${subject} session with ${conversation.client.name} on
        ${formatDate(startsAt)} is scheduled and their tokens have been
        reserved. Once you've taught it, come back and mark it as
        complete to get paid.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/tutor-dashboard");

  return { bookingId: booking.id };
}

export async function markSessionComplete(
  bookingId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true, client: true, payment: true },
  });
  if (!booking || booking.tutor.userId !== user.id) return { error: "Booking not found." };
  if (booking.status !== "CONFIRMED") {
    return { error: "This session can't be marked as complete." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    if (booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: "SUCCEEDED" },
      });
    }
    await tx.tutorProfile.update({
      where: { id: booking.tutorId },
      data: {
        balancePence: { increment: booking.tutorPayoutPence },
        totalEarnedPence: { increment: booking.tutorPayoutPence },
      },
    });
    await tx.tutorLedgerEntry.create({
      data: {
        tutorId: booking.tutorId,
        type: "EARNING",
        amountPence: booking.tutorPayoutPence,
        bookingId: booking.id,
        description: `${booking.subject} session with ${booking.client.name} on ${formatDate(booking.startsAt)}`,
      },
    });
  });

  await logAudit({
    actorId: user.id,
    action: "SESSION_COMPLETED",
    targetType: "Booking",
    targetId: booking.id,
  });

  await Promise.all([
    sendEmail({
      to: booking.client.email,
      subject: "Your session has been marked complete",
      html: baseEmailLayout(`
        <p>Hi ${booking.client.name},</p>
        <p>Your tutor marked your ${booking.subject} session on
        ${formatDate(booking.startsAt)} as complete.</p>
      `),
    }),
    sendEmail({
      to: user.email,
      subject: "Session complete — you've been paid",
      html: baseEmailLayout(`
        <p>Hi ${user.name},</p>
        <p>Your ${booking.subject} session with ${booking.client.name} on
        ${formatDate(booking.startsAt)} has been marked complete &mdash;
        payout ${formatCurrencyGBP(booking.tutorPayoutPence)}.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath("/tutor-dashboard/earnings");
  revalidatePath("/tutor-dashboard");

  return {};
}

export async function cancelUpcomingSession(
  bookingId: string,
  reason?: string,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true, client: true, payment: true },
  });
  if (!booking || booking.tutor.userId !== user.id) return { error: "Booking not found." };
  if (booking.status !== "CONFIRMED") {
    return { error: "This session can't be cancelled." };
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
        description: `${formatTokenQuantity(tokensUsed)} token(s) refunded — ${booking.subject} session on ${formatDate(booking.startsAt)} was cancelled by your tutor`,
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
  });

  await logAudit({
    actorId: user.id,
    action: "SESSION_CANCELLED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { reason: reason ?? null },
  });

  await sendEmail({
    to: booking.client.email,
    subject: "An upcoming session was cancelled",
    html: baseEmailLayout(`
      <p>Hi ${booking.client.name},</p>
      <p>Your tutor cancelled the ${booking.subject} session scheduled for
      ${formatDate(booking.startsAt)} &mdash; your tokens have been
      refunded in full.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
    `),
  }).catch(() => {});

  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard");

  return {};
}

export async function updateScheduledSession(
  bookingId: string,
  input: UpdateSessionInput,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");
  const parsed = updateSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { subject, level, examBoard, sessionMode, date, notes, durationMinutes } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      client: true,
      tutor: { include: { user: { select: { name: true, email: true } } } },
      payment: true,
    },
  });
  if (!booking || booking.tutor.userId !== user.id) return { error: "Session not found." };
  if (booking.status !== "CONFIRMED") {
    return { error: "Only sessions that haven't happened yet can be edited." };
  }
  const profile = booking.tutor;
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    return {
      error: `You only offer ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`,
    };
  }

  const oldLevel = booking.level;
  const oldTokensUsed = Number(booking.tokensUsed);
  const newTokensUsed = durationMinutes / 60;
  const startsAt = date;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
  const tokensChanged = level !== oldLevel || newTokensUsed !== oldTokensUsed;

  // Only recompute price/payout when the level or length actually changed
  // (and therefore the tokens were released and re-reserved below) — an
  // edit that only touches e.g. notes or the exam board must not silently
  // reprice a booking against today's rates if pricing has changed since
  // it was scheduled.
  const pricePence = tokensChanged
    ? Math.round(LEVEL_PRICE_PENCE[level] * newTokensUsed)
    : booking.pricePence;
  const platformFeePence = tokensChanged
    ? Math.round(PLATFORM_FEE_PENCE * newTokensUsed)
    : booking.platformFeePence;
  const tutorPayoutPence = tokensChanged ? pricePence - platformFeePence : booking.tutorPayoutPence;

  try {
    await prisma.$transaction(async (tx) => {
      if (tokensChanged) {
        // Release the old reservation, then make a fresh one for the new
        // level/length — handles a level change, a length change, or both,
        // the same way a cancel-and-reschedule would.
        await tx.tokenBalance.upsert({
          where: { userId_level: { userId: booking.clientId, level: oldLevel } },
          create: { userId: booking.clientId, level: oldLevel, balance: oldTokensUsed },
          update: { balance: { increment: oldTokensUsed } },
        });
        await tx.tokenTransaction.create({
          data: {
            userId: booking.clientId,
            level: oldLevel,
            type: "REFUND",
            quantity: oldTokensUsed,
            bookingId: booking.id,
            description: `${formatTokenQuantity(oldTokensUsed)} token(s) released — ${booking.subject} session on ${formatDate(booking.startsAt)} was edited by your tutor`,
          },
        });

        const claimed = await tx.tokenBalance.updateMany({
          where: { userId: booking.clientId, level, balance: { gte: newTokensUsed } },
          data: { balance: { decrement: newTokensUsed } },
        });
        if (claimed.count === 0) {
          throw new Error(
            `${booking.client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Ask them to buy more, or choose a shorter length.`,
          );
        }
        await tx.tokenTransaction.create({
          data: {
            userId: booking.clientId,
            level,
            type: "REDEEM",
            quantity: -newTokensUsed,
            bookingId: booking.id,
            description: `${subject} session (${formatSessionDuration(durationMinutes)}) rescheduled for ${formatDate(startsAt)} by your tutor`,
          },
        });
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: {
          subject,
          level,
          examBoard: examBoard || null,
          sessionMode,
          startsAt,
          endsAt,
          tokensUsed: newTokensUsed,
          pricePence,
          platformFeePence,
          tutorPayoutPence,
          notes: notes || null,
        },
      });

      if (tokensChanged && booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { amountPence: pricePence, platformFeePence, tutorAmountPence: tutorPayoutPence },
        });
      }
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  await logAudit({
    actorId: user.id,
    action: "SESSION_EDITED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { level, durationMinutes, tokensChanged },
  });

  await sendEmail({
    to: booking.client.email,
    subject: "Your scheduled session was updated",
    html: baseEmailLayout(`
      <p>Hi ${booking.client.name},</p>
      <p>${profile.user.name} updated your ${subject} session — it's now
      ${formatSessionDuration(durationMinutes)} on ${formatDate(startsAt)}.</p>
      <p>If this doesn't look right, reply to your tutor or
      <a href="mailto:info@channeltutoring.com">contact us</a>.</p>
    `),
  }).catch(() => {});

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard");

  return {};
}

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
    const claimed = await tx.tokenBalance.updateMany({
      where: { userId: clientId, level, balance: { gte: tokensUsed } },
      data: { balance: { decrement: tokensUsed } },
    });
    if (claimed.count === 0) {
      throw new Error(
        `${conversation.client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Ask them to buy more before you log this lesson.`,
      );
    }
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
