"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { region } from "@/lib/region";
import {
  formatDate,
  formatDateTime,
  formatWeekday,
  formatTime,
  formatCurrency,
  formatLevel,
  formatTokenQuantity,
  escapeHtml,
} from "@/lib/utils";
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
import { hasSchedulingConflict } from "@/lib/booking-conflicts";
import { tryClaimTokens } from "@/lib/actions/token-reservation";

export async function scheduleSession(
  input: ScheduleSessionInput,
): Promise<
  | { error: string; bookingId?: undefined }
  | { error?: undefined; bookingId: string; scheduledCount: number; unpaidCount: number }
> {
  const user = await requireUser("TUTOR");
  const parsed = scheduleSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientId, subject, level, examBoard, sessionMode, date, notes, durationMinutes, repeatWeeks } =
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
  const durationMs = durationMinutes * 60 * 1000;
  const isRecurring = repeatWeeks > 1;
  const occurrences = Array.from({ length: repeatWeeks }, (_, i) => {
    const startsAt = new Date(date.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    return { startsAt, endsAt: new Date(startsAt.getTime() + durationMs) };
  });

  // Check the whole series for conflicts before creating anything, rather
  // than leaving a partially-created series behind if a later week clashes.
  const conflicts = await Promise.all(
    occurrences.map((occ) => hasSchedulingConflict(profile.id, occ.startsAt, occ.endsAt)),
  );
  const conflictIndex = conflicts.findIndex(Boolean);
  if (conflictIndex !== -1) {
    return {
      error: `You already have a session scheduled that overlaps with ${formatDateTime(occurrences[conflictIndex].startsAt)}.`,
    };
  }

  const seriesId = isRecurring ? randomUUID() : null;

  let bookings;
  try {
    bookings = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const occ of occurrences) {
        // Atomic conditional decrement — the WHERE clause is re-checked
        // against the row's committed value even under a concurrent
        // transaction, so two simultaneous schedules against the same
        // almost-exhausted balance can't both succeed and drive it
        // negative. Sessions are always scheduled regardless of whether
        // this succeeds — an unclaimed session just goes ahead unpaid and
        // catches up later, see tokensReserved below.
        const claimed = await tryClaimTokens(tx, clientId, level, tokensUsed);
        if (claimed) {
          await tx.tokenTransaction.create({
            data: {
              userId: clientId,
              level,
              type: "REDEEM",
              quantity: -tokensUsed,
              description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled with ${profile.user.name} for ${formatDate(occ.startsAt)}`,
            },
          });
        }

        const bookingRow = await tx.booking.create({
          data: {
            clientId,
            tutorId: profile.id,
            subject,
            level,
            examBoard: examBoard || null,
            sessionMode,
            startsAt: occ.startsAt,
            endsAt: occ.endsAt,
            tokensUsed,
            pricePence,
            platformFeePence,
            tutorPayoutPence,
            notes: notes || null,
            status: "CONFIRMED",
            seriesId,
            tokensReserved: claimed,
          },
        });

        if (claimed) {
          await tx.payment.create({
            data: {
              bookingId: bookingRow.id,
              amountPence: pricePence,
              platformFeePence,
              tutorAmountPence: tutorPayoutPence,
              status: "PENDING",
            },
          });
        }

        created.push(bookingRow);
      }
      return created;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  const firstBooking = bookings[0];
  const unpaidCount = bookings.filter((b) => !b.tokensReserved).length;

  await logAudit({
    actorId: user.id,
    action: isRecurring ? "RECURRING_SESSION_SCHEDULED" : "SESSION_SCHEDULED",
    targetType: "Booking",
    targetId: firstBooking.id,
    metadata: { clientId, level, tokensUsed, repeatWeeks, seriesId, unpaidCount },
  });

  const sessionWord = bookings.length === 1 ? "session" : "sessions";
  const clientIntro = isRecurring
    ? `${escapeHtml(profile.user.name)} has scheduled ${bookings.length} weekly
       ${escapeHtml(subject)} sessions with you, every ${formatWeekday(date)} at
       ${formatTime(date)}, starting ${formatDate(date)}. You'll see these under
       Upcoming Sessions on your dashboard.`
    : `${escapeHtml(profile.user.name)} has scheduled a ${formatSessionDuration(durationMinutes)}
       ${escapeHtml(subject)} session with you on ${formatDate(date)}. You'll see this
       under Upcoming Sessions on your dashboard.`;

  let clientPaymentStatus: string;
  if (unpaidCount === 0) {
    clientPaymentStatus = `<p>${formatTokenQuantity(bookings.length * tokensUsed)} of your
      ${formatLevel(level)} tokens have covered this ${sessionWord}.</p>`;
  } else if (bookings.length === 1) {
    clientPaymentStatus = `<p>This session isn't paid for yet — add ${formatLevel(level)}
      tokens to your account before the date above, or we'll remind you on the day.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`;
  } else {
    clientPaymentStatus = `<p>${unpaidCount} of these ${unpaidCount === 1 ? "session isn't" : "sessions aren't"}
      paid for yet — add ${formatLevel(level)} tokens to your account before each
      session's date, or we'll remind you on the day.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`;
  }

  const clientEmailBody = `
    <p>Hi ${escapeHtml(conversation.client.name)},</p>
    <p>${clientIntro}</p>
    ${clientPaymentStatus}
    <p>If this doesn't look right, reply to your tutor or
    <a href="mailto:${region.supportEmail}">contact us</a>.</p>
  `;

  const tutorIntro = isRecurring
    ? `Your ${escapeHtml(subject)} sessions with ${escapeHtml(conversation.client.name)} are
       scheduled &mdash; ${bookings.length} weekly sessions every ${formatWeekday(date)} at
       ${formatTime(date)}, starting ${formatDate(date)}.`
    : `Your ${escapeHtml(subject)} session with ${escapeHtml(conversation.client.name)} on
       ${formatDate(date)} is scheduled.`;

  let tutorPaymentStatus: string;
  if (unpaidCount === 0) {
    tutorPaymentStatus = `<p>${escapeHtml(conversation.client.name)}'s tokens have been reserved.</p>`;
  } else if (bookings.length === 1) {
    tutorPaymentStatus = `<p>It isn't paid for yet — it'll show as awaiting payment until
      ${escapeHtml(conversation.client.name)} tops up their tokens. We'll remind them if it's
      still unpaid on the day.</p>`;
  } else {
    tutorPaymentStatus = `<p>${unpaidCount} of these ${unpaidCount === 1 ? "isn't" : "aren't"}
      paid for yet — they'll show as awaiting payment until ${escapeHtml(conversation.client.name)}
      tops up their tokens. We'll remind them if a session's date arrives unpaid.</p>`;
  }

  const tutorEmailBody = `
    <p>Hi ${escapeHtml(profile.user.name)},</p>
    <p>${tutorIntro}</p>
    ${tutorPaymentStatus}
    <p>${bookings.length === 1 ? "Once you've taught it, come back and mark it as complete to get paid." : "Mark each one as complete once you've taught it to get paid."}</p>
  `;

  await Promise.all([
    sendEmail({
      to: conversation.client.email,
      subject: isRecurring
        ? `Your weekly sessions have been scheduled on ${region.brandName}`
        : `A session has been scheduled on ${region.brandName}`,
      html: baseEmailLayout(clientEmailBody),
    }),
    sendEmail({
      to: profile.user.email,
      subject: isRecurring ? "Weekly sessions scheduled" : "Session scheduled",
      html: baseEmailLayout(tutorEmailBody),
    }),
  ]).catch(() => {});

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/tutor-dashboard");

  return { bookingId: firstBooking.id, scheduledCount: bookings.length, unpaidCount };
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
  if (!booking.tokensReserved) {
    return {
      error: `${booking.client.name} hasn't paid for this session yet — it can't be marked complete until they've added enough tokens.`,
    };
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
        <p>Hi ${escapeHtml(booking.client.name)},</p>
        <p>Your tutor marked your ${escapeHtml(booking.subject)} session on
        ${formatDate(booking.startsAt)} as complete.</p>
      `),
    }),
    sendEmail({
      to: user.email,
      subject: "Session complete — you've been paid",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(user.name)},</p>
        <p>Your ${escapeHtml(booking.subject)} session with ${escapeHtml(booking.client.name)} on
        ${formatDate(booking.startsAt)} has been marked complete &mdash;
        payout ${formatCurrency(booking.tutorPayoutPence)}.</p>
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
    // Only refund a token if one was actually reserved for this booking —
    // an unpaid recurring occurrence never took one, so there's nothing to
    // give back.
    if (booking.tokensReserved) {
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
    }

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
      <p>Hi ${escapeHtml(booking.client.name)},</p>
      <p>Your tutor cancelled the ${escapeHtml(booking.subject)} session scheduled for
      ${formatDate(booking.startsAt)} &mdash; your tokens have been
      refunded in full.</p>
      ${reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ""}
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

  if (await hasSchedulingConflict(booking.tutorId, startsAt, endsAt, booking.id)) {
    return { error: "You already have a session scheduled that overlaps with this time." };
  }

  let finalTokensReserved = booking.tokensReserved;
  try {
    await prisma.$transaction(async (tx) => {
      let tokensReserved = booking.tokensReserved;

      if (tokensChanged) {
        if (booking.tokensReserved) {
          // Release the old reservation first — it's for a config this
          // booking no longer needs.
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
          tokensReserved = false;
        }

        // Try to claim for the new level/length. Never blocks the edit if
        // it can't be afforded right now — the session just goes ahead (or
        // stays) marked as awaiting payment, same as scheduling one fresh.
        const claimed = await tryClaimTokens(tx, booking.clientId, level, newTokensUsed);
        if (claimed) {
          tokensReserved = true;
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
      } else if (!booking.tokensReserved) {
        // Level/length unchanged but still unpaid — try again in case
        // tokens are now available.
        const claimed = await tryClaimTokens(tx, booking.clientId, level, newTokensUsed);
        if (claimed) {
          tokensReserved = true;
          await tx.tokenTransaction.create({
            data: {
              userId: booking.clientId,
              level,
              type: "REDEEM",
              quantity: -newTokensUsed,
              bookingId: booking.id,
              description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled for ${formatDate(startsAt)} by your tutor`,
            },
          });
        }
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
          tokensReserved,
        },
      });

      if (tokensReserved && booking.payment) {
        // Still (or newly) paid, and a Payment row already exists —
        // whichever amount is now correct, keep it in sync.
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { amountPence: pricePence, platformFeePence, tutorAmountPence: tutorPayoutPence },
        });
      } else if (tokensReserved && !booking.payment) {
        // Newly paid, and this booking never had a Payment row.
        await tx.payment.create({
          data: {
            bookingId: booking.id,
            amountPence: pricePence,
            platformFeePence,
            tutorAmountPence: tutorPayoutPence,
            status: "PENDING",
          },
        });
      } else if (!tokensReserved && booking.payment) {
        // Went from paid to unpaid (the new config couldn't be claimed) —
        // remove the now-stale Payment row so a future successful claim
        // can create a fresh one instead of hitting a duplicate booking.
        await tx.payment.delete({ where: { id: booking.payment.id } });
      }

      finalTokensReserved = tokensReserved;
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
      <p>Hi ${escapeHtml(booking.client.name)},</p>
      <p>${escapeHtml(profile.user.name)} updated your ${escapeHtml(subject)} session — it's now
      ${formatSessionDuration(durationMinutes)} on ${formatDate(startsAt)}.</p>
      ${
        !finalTokensReserved
          ? `<p>This session isn't paid for yet — add ${formatLevel(level)} tokens to your
             account before the date above, or we'll remind you on the day.
             <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`
          : ""
      }
      <p>If this doesn't look right, reply to your tutor or
      <a href="mailto:${region.supportEmail}">contact us</a>.</p>
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
      subject: `A lesson has been logged on ${region.brandName}`,
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(conversation.client.name)},</p>
        <p>${escapeHtml(profile.user.name)} logged your ${formatSessionDuration(durationMinutes)}
        ${escapeHtml(subject)} lesson on ${formatDate(startsAt)} as complete, using
        ${formatTokenQuantity(tokensUsed)} of your
        ${formatLevel(level)} tokens.</p>
        <p>If this doesn't look right, reply to your tutor or
        <a href="mailto:${region.supportEmail}">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "Lesson logged — you've been paid",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(profile.user.name)},</p>
        <p>Your ${escapeHtml(subject)} lesson with ${escapeHtml(conversation.client.name)} on
        ${formatDate(startsAt)} has been logged &mdash; payout
        ${formatCurrency(tutorPayoutPence)}.</p>
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

  // Undoing this log reduces the tutor's balance, but a payout already
  // requested was sized against the balance as it stood at request time —
  // reducing it now would make that payout's amount stale (too high) once
  // an admin approves it. Block the undo until that payout is resolved.
  const pendingPayout = await prisma.payout.findFirst({
    where: { tutorId: booking.tutorId, status: "PENDING" },
  });
  if (pendingPayout) {
    return {
      error: "This tutor has a withdrawal request being processed — it must be paid or resolved before this lesson log can be undone.",
    };
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
      <p>Hi ${escapeHtml(booking.client.name)},</p>
      <p>${booking.tutor.userId === user.id ? "Your tutor" : region.brandName}
      undid the ${escapeHtml(booking.subject)} lesson logged for
      ${formatDate(booking.startsAt)} &mdash; your token has been refunded.</p>
      ${reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : ""}
    `),
  }).catch(() => {});

  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);

  return {};
}
