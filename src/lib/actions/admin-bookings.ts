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
  formatLevel,
  formatTokenQuantity,
  escapeHtml,
} from "@/lib/utils";
import { PLATFORM_FEE_PENCE, LEVEL_PRICE_PENCE, formatSessionDuration } from "@/lib/constants";
import {
  adminScheduleSessionSchema,
  adminLogCompletedLessonSchema,
  updateSessionSchema,
  type AdminScheduleSessionInput,
  type AdminLogCompletedLessonInput,
  type UpdateSessionInput,
} from "@/lib/validations/schedule-lesson";
import { hasSchedulingConflict } from "@/lib/booking-conflicts";
import { tryClaimTokens } from "@/lib/actions/token-reservation";

export async function adminScheduleSession(
  input: AdminScheduleSessionInput,
): Promise<
  | { error: string; bookingId?: undefined }
  | { error?: undefined; bookingId: string; scheduledCount: number; unpaidCount: number }
> {
  const admin = await requireUser("ADMIN");
  const parsed = adminScheduleSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientId, tutorProfileId, subject, level, examBoard, sessionMode, date, notes, durationMinutes, repeatWeeks } =
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
  const durationMs = durationMinutes * 60 * 1000;
  const isRecurring = repeatWeeks > 1;
  const occurrences = Array.from({ length: repeatWeeks }, (_, i) => {
    const startsAt = new Date(date.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    return { startsAt, endsAt: new Date(startsAt.getTime() + durationMs) };
  });

  const conflicts = await Promise.all(
    occurrences.map((occ) => hasSchedulingConflict(profile.id, occ.startsAt, occ.endsAt)),
  );
  const conflictIndex = conflicts.findIndex(Boolean);
  if (conflictIndex !== -1) {
    return {
      error: `${profile.user.name} already has a session scheduled that overlaps with ${formatDateTime(occurrences[conflictIndex].startsAt)}.`,
    };
  }

  const seriesId = isRecurring ? randomUUID() : null;

  let bookings;
  try {
    bookings = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const occ of occurrences) {
        const claimed = await tryClaimTokens(tx, clientId, level, tokensUsed);
        if (claimed) {
          await tx.tokenTransaction.create({
            data: {
              userId: clientId,
              level,
              type: "REDEEM",
              quantity: -tokensUsed,
              description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled with ${profile.user.name} for ${formatDate(occ.startsAt)} by ${region.brandName}`,
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
    actorId: admin.id,
    action: isRecurring ? "ADMIN_RECURRING_SESSION_SCHEDULED" : "ADMIN_SESSION_SCHEDULED",
    targetType: "Booking",
    targetId: firstBooking.id,
    metadata: { clientId, tutorProfileId, level, tokensUsed, repeatWeeks, seriesId, unpaidCount },
  });

  const sessionWord = bookings.length === 1 ? "session" : "sessions";
  const clientIntro = isRecurring
    ? `${region.brandName} has scheduled ${bookings.length} weekly
       ${escapeHtml(subject)} sessions for you with ${escapeHtml(profile.user.name)}, every
       ${formatWeekday(date)} at ${formatTime(date)}, starting ${formatDate(date)}. You'll
       see these under Upcoming Sessions on your dashboard.`
    : `${region.brandName} has scheduled a ${formatSessionDuration(durationMinutes)}
       ${escapeHtml(subject)} session for you with ${escapeHtml(profile.user.name)} on
       ${formatDate(date)}. You'll see this under Upcoming Sessions on your dashboard.`;

  let clientPaymentStatus: string;
  if (unpaidCount === 0) {
    clientPaymentStatus = `<p>${formatTokenQuantity(bookings.length * tokensUsed)} of your
      ${formatLevel(level)} tokens have covered this ${sessionWord}.</p>`;
  } else if (bookings.length === 1) {
    clientPaymentStatus = `<p>This session isn't paid for yet — please add ${formatLevel(level)}
      tokens to your account before the date above, or we'll remind you on the day.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`;
  } else {
    clientPaymentStatus = `<p>${unpaidCount} of these ${unpaidCount === 1 ? "session isn't" : "sessions aren't"}
      paid for yet — please add ${formatLevel(level)} tokens to your account before each
      session's date, or we'll remind you on the day.
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`;
  }

  const clientEmailBody = `
    <p>Hi ${escapeHtml(client.name)},</p>
    <p>${clientIntro}</p>
    ${clientPaymentStatus}
    <p>If this doesn't look right, reply to this email or
    <a href="mailto:${region.supportEmail}">contact us</a>.</p>
  `;

  const tutorIntro = isRecurring
    ? `${region.brandName} has scheduled ${bookings.length} weekly ${escapeHtml(subject)}
       sessions for you with ${escapeHtml(client.name)}, every ${formatWeekday(date)} at
       ${formatTime(date)}, starting ${formatDate(date)}.`
    : `${region.brandName} has scheduled a ${escapeHtml(subject)} session for you
       with ${escapeHtml(client.name)} on ${formatDate(date)}.`;

  let tutorPaymentStatus: string;
  if (unpaidCount === 0) {
    tutorPaymentStatus = `<p>${escapeHtml(client.name)}'s tokens have been reserved.</p>`;
  } else if (bookings.length === 1) {
    tutorPaymentStatus = `<p>It isn't paid for yet — it'll show as awaiting payment until
      ${escapeHtml(client.name)} tops up their tokens. We'll remind them if it's still unpaid
      on the day.</p>`;
  } else {
    tutorPaymentStatus = `<p>${unpaidCount} of these ${unpaidCount === 1 ? "isn't" : "aren't"}
      paid for yet — they'll show as awaiting payment until ${escapeHtml(client.name)} tops
      up their tokens. We'll remind them if a session's date arrives unpaid.</p>`;
  }

  const tutorEmailBody = `
    <p>Hi ${escapeHtml(profile.user.name)},</p>
    <p>${tutorIntro}</p>
    ${tutorPaymentStatus}
    <p>${bookings.length === 1 ? "Once you've taught it, mark it as complete in your dashboard to get paid." : "Mark each one as complete once you've taught it to get paid."}</p>
  `;

  await Promise.all([
    sendEmail({
      to: client.email,
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

  revalidatePath("/admin/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  revalidatePath("/tutor-dashboard");

  return { bookingId: firstBooking.id, scheduledCount: bookings.length, unpaidCount };
}

export async function adminUpdateScheduledSession(
  bookingId: string,
  input: UpdateSessionInput,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");
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
  if (!booking) return { error: "Session not found." };
  if (booking.status !== "CONFIRMED") {
    return { error: "Only sessions that haven't happened yet can be edited." };
  }
  const profile = booking.tutor;
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    return {
      error: `${profile.user.name} only offers ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`,
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
    return { error: `${profile.user.name} already has a session scheduled that overlaps with this time.` };
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
              description: `${formatTokenQuantity(oldTokensUsed)} token(s) released — ${booking.subject} session on ${formatDate(booking.startsAt)} was edited by ${region.brandName}`,
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
              description: `${subject} session (${formatSessionDuration(durationMinutes)}) rescheduled for ${formatDate(startsAt)} by ${region.brandName}`,
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
              description: `${subject} session (${formatSessionDuration(durationMinutes)}) scheduled for ${formatDate(startsAt)} by ${region.brandName}`,
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
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { amountPence: pricePence, platformFeePence, tutorAmountPence: tutorPayoutPence },
        });
      } else if (tokensReserved && !booking.payment) {
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
    actorId: admin.id,
    action: "ADMIN_SESSION_EDITED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { level, durationMinutes, tokensChanged },
  });

  await Promise.all([
    sendEmail({
      to: booking.client.email,
      subject: "Your scheduled session was updated",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(booking.client.name)},</p>
        <p>${region.brandName} updated your ${escapeHtml(subject)} session with
        ${escapeHtml(profile.user.name)} — it's now ${formatSessionDuration(durationMinutes)}
        on ${formatDate(startsAt)}.</p>
        ${
          !finalTokensReserved
            ? `<p>This session isn't paid for yet — please add ${formatLevel(level)} tokens to
               your account before the date above, or we'll remind you on the day.
               <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tokens">Buy tokens</a></p>`
            : ""
        }
        <p>If this doesn't look right, reply to this email or
        <a href="mailto:${region.supportEmail}">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "A scheduled session was updated",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(profile.user.name)},</p>
        <p>${region.brandName} updated your ${escapeHtml(subject)} session with
        ${escapeHtml(booking.client.name)} — it's now ${formatSessionDuration(durationMinutes)}
        on ${formatDate(startsAt)}.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${booking.id}`);
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/tutor-dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/tutor-dashboard");

  return {};
}

export async function adminLogCompletedLesson(
  input: AdminLogCompletedLessonInput,
): Promise<{ error: string; bookingId?: undefined } | { error?: undefined; bookingId: string }> {
  const admin = await requireUser("ADMIN");
  const parsed = adminLogCompletedLessonSchema.safeParse(input);
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
      const claimed = await tx.tokenBalance.updateMany({
        where: { userId: clientId, level, balance: { gte: tokensUsed } },
        data: { balance: { decrement: tokensUsed } },
      });
      if (claimed.count === 0) {
        throw new Error(
          `${client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Grant them tokens first, or reduce the session length.`,
        );
      }
      await tx.tokenTransaction.create({
        data: {
          userId: clientId,
          level,
          type: "REDEEM",
          quantity: -tokensUsed,
          description: `${subject} lesson (${formatSessionDuration(durationMinutes)}) with ${profile.user.name} on ${formatDate(startsAt)}, logged by ${region.brandName}`,
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
          description: `${subject} lesson with ${client.name} on ${formatDate(startsAt)}`,
        },
      });

      return created;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

  await logAudit({
    actorId: admin.id,
    action: "ADMIN_LESSON_LOGGED",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { clientId, tutorProfileId, level, tokensUsed },
  });

  await Promise.all([
    sendEmail({
      to: client.email,
      subject: `A lesson has been logged on ${region.brandName}`,
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(client.name)},</p>
        <p>${region.brandName} logged your ${formatSessionDuration(durationMinutes)}
        ${escapeHtml(subject)} lesson with ${escapeHtml(profile.user.name)} on
        ${formatDate(startsAt)} as complete, using
        ${formatTokenQuantity(tokensUsed)} of your
        ${formatLevel(level)} tokens.</p>
        <p>If this doesn't look right, reply to this email or
        <a href="mailto:${region.supportEmail}">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "A lesson was logged for you",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(profile.user.name)},</p>
        <p>${region.brandName} logged your ${escapeHtml(subject)} lesson with
        ${escapeHtml(client.name)} on ${formatDate(startsAt)} as complete
        &mdash; payout ${formatTokenQuantity(tokensUsed)} token(s) /
        you&apos;ve been paid.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/admin/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/tutor-dashboard/earnings");
  revalidatePath("/dashboard/bookings");

  return { bookingId: booking.id };
}
