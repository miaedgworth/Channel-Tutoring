"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDate, formatLevel, formatTokenQuantity, escapeHtml } from "@/lib/utils";
import { PLATFORM_FEE_PENCE, LEVEL_PRICE_PENCE, formatSessionDuration } from "@/lib/constants";
import {
  adminScheduleSessionSchema,
  updateSessionSchema,
  type AdminScheduleSessionInput,
  type UpdateSessionInput,
} from "@/lib/validations/schedule-lesson";
import { hasSchedulingConflict } from "@/lib/booking-conflicts";

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

  if (await hasSchedulingConflict(profile.id, startsAt, endsAt)) {
    return { error: `${profile.user.name} already has a session scheduled that overlaps with this time.` };
  }

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
        <p>Hi ${escapeHtml(client.name)},</p>
        <p>Channel Tutoring has scheduled a ${formatSessionDuration(durationMinutes)}
        ${escapeHtml(subject)} session for you with ${escapeHtml(profile.user.name)} on
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
        <p>Hi ${escapeHtml(profile.user.name)},</p>
        <p>Channel Tutoring has scheduled a ${escapeHtml(subject)} session for you
        with ${escapeHtml(client.name)} on ${formatDate(startsAt)}. Once you've
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
            description: `${formatTokenQuantity(oldTokensUsed)} token(s) released — ${booking.subject} session on ${formatDate(booking.startsAt)} was edited by Channel Tutoring`,
          },
        });

        const claimed = await tx.tokenBalance.updateMany({
          where: { userId: booking.clientId, level, balance: { gte: newTokensUsed } },
          data: { balance: { decrement: newTokensUsed } },
        });
        if (claimed.count === 0) {
          throw new Error(
            `${booking.client.name} doesn't have enough ${formatLevel(level)} tokens for a ${formatSessionDuration(durationMinutes)} session. Grant them tokens first, or choose a shorter length.`,
          );
        }
        await tx.tokenTransaction.create({
          data: {
            userId: booking.clientId,
            level,
            type: "REDEEM",
            quantity: -newTokensUsed,
            bookingId: booking.id,
            description: `${subject} session (${formatSessionDuration(durationMinutes)}) rescheduled for ${formatDate(startsAt)} by Channel Tutoring`,
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
        <p>Channel Tutoring updated your ${escapeHtml(subject)} session with
        ${escapeHtml(profile.user.name)} — it's now ${formatSessionDuration(durationMinutes)}
        on ${formatDate(startsAt)}.</p>
        <p>If this doesn't look right, reply to this email or
        <a href="mailto:info@channeltutoring.com">contact us</a>.</p>
      `),
    }),
    sendEmail({
      to: profile.user.email,
      subject: "A scheduled session was updated",
      html: baseEmailLayout(`
        <p>Hi ${escapeHtml(profile.user.name)},</p>
        <p>Channel Tutoring updated your ${escapeHtml(subject)} session with
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
