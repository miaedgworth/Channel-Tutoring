"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDateTime, formatCurrencyGBP } from "@/lib/utils";
import {
  CANCELLATION_PARTIAL_REFUND_RATE,
  PLATFORM_FEE_PENCE,
  LEVEL_PRICE_PENCE,
  BLOCK_BOOKING_MIN_SESSIONS,
  BLOCK_BOOKING_DISCOUNT_RATE,
} from "@/lib/constants";
import { scheduleLessonSchema, type ScheduleLessonInput } from "@/lib/validations/schedule-lesson";

const FREE_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function scheduleLesson(input: ScheduleLessonInput) {
  const user = await requireUser("TUTOR");
  const parsed = scheduleLessonSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { clientId, subject, level, examBoard, sessionMode, dates, durationMinutes, notes } =
    parsed.data;

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    include: { user: { select: { name: true } } },
  });
  if (!profile) throw new Error("Tutor profile not found.");
  if (profile.sessionMode !== "BOTH" && profile.sessionMode !== sessionMode) {
    throw new Error(`You only offer ${profile.sessionMode === "ONLINE" ? "online" : "in-person"} sessions.`);
  }

  // Only allow scheduling for clients the tutor already has a conversation
  // with, so this can't be used to create bookings for arbitrary users.
  const conversation = await prisma.conversation.findUnique({
    where: { clientId_tutorProfileId: { clientId, tutorProfileId: profile.id } },
    include: { client: true },
  });
  if (!conversation) {
    throw new Error("You can only schedule lessons for clients you're already messaging.");
  }

  const levelPricePence = LEVEL_PRICE_PENCE[level];
  const fullPricePence = Math.round((levelPricePence * durationMinutes) / 60);
  const applyDiscount = dates.length >= BLOCK_BOOKING_MIN_SESSIONS;
  const discountedPricePence = applyDiscount
    ? Math.round(fullPricePence * (1 - BLOCK_BOOKING_DISCOUNT_RATE))
    : fullPricePence;
  const discountPence = fullPricePence - discountedPricePence;
  // The tutor is always paid as if there were no discount; the block
  // booking discount comes entirely out of the platform's fee.
  const tutorPayoutPence = fullPricePence - PLATFORM_FEE_PENCE;
  const platformFeePence = discountedPricePence - tutorPayoutPence;

  if (tutorPayoutPence <= 0) {
    throw new Error(
      `A ${durationMinutes}-minute session at this level doesn't cover the platform fee. Choose a longer duration.`,
    );
  }
  if (platformFeePence <= 0) {
    throw new Error("This discount can't be applied to sessions this short. Choose a longer duration.");
  }

  const sortedDates = [...dates].sort((a, b) => a.getTime() - b.getTime());

  const bookings = await prisma.$transaction(
    sortedDates.map((startsAt) => {
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      return prisma.booking.create({
        data: {
          clientId,
          tutorId: profile.id,
          subject,
          level,
          examBoard: examBoard || null,
          sessionMode,
          startsAt,
          endsAt,
          pricePence: discountedPricePence,
          discountPence,
          platformFeePence,
          tutorPayoutPence,
          notes: notes || null,
          status: "PENDING_PAYMENT",
        },
      });
    }),
  );

  await logAudit({
    actorId: user.id,
    action: "LESSON_SCHEDULED",
    targetType: "Booking",
    targetId: bookings[0].id,
    metadata: { clientId, count: bookings.length, discounted: applyDiscount },
  });

  const totalPence = bookings.reduce((sum, b) => sum + b.pricePence, 0);
  await sendEmail({
    to: conversation.client.email,
    subject:
      bookings.length > 1
        ? `${bookings.length} Channel Tutoring lessons are ready to confirm`
        : "Your Channel Tutoring lesson is ready to confirm",
    html: baseEmailLayout(`
      <p>Hi ${conversation.client.name},</p>
      <p>${profile.user.name} has scheduled ${bookings.length > 1 ? `${bookings.length} ${subject} sessions` : `a ${subject} session`} with you:</p>
      <ul>
        ${bookings.map((b) => `<li>${formatDateTime(b.startsAt)}</li>`).join("")}
      </ul>
      ${
        applyDiscount
          ? `<p>A ${Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% block-booking discount has been applied.</p>`
          : ""
      }
      <p>Log in to your dashboard to review the details and use your credit
      balance to confirm ${bookings.length > 1 ? "each session" : "the booking"}
      (${formatCurrencyGBP(totalPence)} total). If you don't have enough
      credit, you can top up first.</p>
    `),
  }).catch(() => {});

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");

  return bookings[0].id;
}

export async function confirmBookingWithCredit(bookingId: string) {
  const user = await requireUser("CLIENT");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: { include: { user: true } } },
  });
  if (!booking || booking.clientId !== user.id) throw new Error("Booking not found.");
  if (booking.status !== "PENDING_PAYMENT") {
    throw new Error("This booking isn't awaiting payment.");
  }

  const client = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (client.creditBalancePence < booking.pricePence) {
    throw new Error("You don't have enough credit to confirm this booking. Top up your balance first.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { creditBalancePence: { decrement: booking.pricePence } },
    });
    await tx.creditTransaction.create({
      data: {
        userId: user.id,
        type: "SPEND",
        amountPence: -booking.pricePence,
        bookingId: booking.id,
        description: `${booking.subject} session with ${booking.tutor.user.name} on ${booking.startsAt.toLocaleDateString("en-GB")}`,
      },
    });
    await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amountPence: booking.pricePence,
        platformFeePence: booking.platformFeePence,
        tutorAmountPence: booking.tutorPayoutPence,
        status: "SUCCEEDED",
      },
    });
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
        description: `${booking.subject} session with ${client.name} on ${booking.startsAt.toLocaleDateString("en-GB")}`,
      },
    });
  });

  await logAudit({
    actorId: user.id,
    action: "BOOKING_CONFIRMED_WITH_CREDIT",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { amountPence: booking.pricePence },
  });

  await Promise.all([
    sendEmail({
      to: client.email,
      subject: "Your Channel Tutoring session is confirmed",
      html: baseEmailLayout(`
        <p>Hi ${client.name},</p>
        <p>Your ${booking.subject} session with ${booking.tutor.user.name} on
        ${formatDateTime(booking.startsAt)} is confirmed.</p>
        <p>${formatCurrencyGBP(booking.pricePence)} was deducted from your
        credit balance.</p>
      `),
    }),
    sendEmail({
      to: booking.tutor.user.email,
      subject: "A lesson has been confirmed",
      html: baseEmailLayout(`
        <p>Hi ${booking.tutor.user.name},</p>
        <p>${client.name} has confirmed your ${booking.subject} session on
        ${formatDateTime(booking.startsAt)} &mdash; payout
        ${formatCurrencyGBP(booking.tutorPayoutPence)}.</p>
      `),
    }),
  ]).catch(() => {});

  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: { include: { user: true } },
      client: true,
      payment: true,
    },
  });
  if (!booking) throw new Error("Booking not found.");

  const isClient = booking.clientId === user.id;
  const isTutor = booking.tutor.userId === user.id;
  if (!isClient && !isTutor) throw new Error("You don't have access to this booking.");

  if (!["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status)) {
    throw new Error("This booking can't be cancelled.");
  }

  const withinFreeWindow = booking.startsAt.getTime() - Date.now() > FREE_CANCELLATION_WINDOW_MS;
  // Tutor-initiated cancellations, and client cancellations outside the
  // 24-hour window, are refunded in full. A client cancelling within 24
  // hours is refunded 50%, per our Cancellation Policy.
  const refundFraction =
    booking.status !== "CONFIRMED" ? 0 : isTutor || withinFreeWindow ? 1 : CANCELLATION_PARTIAL_REFUND_RATE;
  const shouldRefund = refundFraction > 0;
  const refundAmountPence = booking.payment
    ? Math.round(booking.payment.amountPence * refundFraction)
    : 0;
  const tutorReversalPence = Math.round(booking.tutorPayoutPence * refundFraction);

  const isCreditFunded = shouldRefund && booking.payment && !booking.payment.stripePaymentIntentId;

  if (shouldRefund && booking.payment?.stripePaymentIntentId && isStripeConfigured()) {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: booking.payment.stripePaymentIntentId,
      amount: refundAmountPence,
      reason: "requested_by_customer",
    });
  }

  await prisma.$transaction(async (tx) => {
    if (isCreditFunded) {
      await tx.user.update({
        where: { id: booking.clientId },
        data: { creditBalancePence: { increment: refundAmountPence } },
      });
      await tx.creditTransaction.create({
        data: {
          userId: booking.clientId,
          type: "REFUND",
          amountPence: refundAmountPence,
          bookingId: booking.id,
          description: `${refundFraction === 1 ? "Refund" : "Partial refund"} for cancelled ${booking.subject} session on ${booking.startsAt.toLocaleDateString("en-GB")}`,
        },
      });
    }

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: isTutor ? "CANCELLED_BY_TUTOR" : "CANCELLED_BY_CLIENT",
        cancellationReason: reason || null,
        cancelledAt: new Date(),
      },
    });

    if (shouldRefund && booking.payment) {
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: {
          status: refundFraction === 1 ? "REFUNDED" : "PARTIALLY_REFUNDED",
          refundedPence: refundAmountPence,
        },
      });
      await tx.tutorProfile.update({
        where: { id: booking.tutorId },
        data: {
          balancePence: { decrement: tutorReversalPence },
          totalEarnedPence: { decrement: tutorReversalPence },
        },
      });
      await tx.tutorLedgerEntry.create({
        data: {
          tutorId: booking.tutorId,
          type: "REFUND",
          amountPence: -tutorReversalPence,
          bookingId: booking.id,
          description: `${refundFraction === 1 ? "Refund" : "Partial refund"} for cancelled ${booking.subject} session on ${booking.startsAt.toLocaleDateString("en-GB")}`,
        },
      });
    }
  });

  await logAudit({
    actorId: user.id,
    action: isTutor ? "BOOKING_CANCELLED_BY_TUTOR" : "BOOKING_CANCELLED_BY_CLIENT",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { reason: reason ?? null, refunded: shouldRefund, refundFraction },
  });

  const otherPartyEmail = isTutor ? booking.client.email : booking.tutor.user.email;
  const otherPartyName = isTutor ? booking.client.name : booking.tutor.user.name;
  await sendEmail({
    to: otherPartyEmail,
    subject: "A Channel Tutoring session was cancelled",
    html: baseEmailLayout(`
      <p>Hi ${otherPartyName},</p>
      <p>Your ${booking.subject} session on ${formatDateTime(booking.startsAt)} has been
      cancelled${isTutor ? " by the tutor" : ""}.</p>
      ${
        shouldRefund
          ? `<p>${refundFraction === 1 ? "A full refund" : `A 50% refund (${formatCurrencyGBP(refundAmountPence)})`} has been issued.</p>`
          : ""
      }
      ${reason ? `<p>Reason: ${reason}</p>` : ""}
    `),
  }).catch(() => {});

  revalidatePath("/dashboard/bookings");
  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath(`/dashboard/bookings/${booking.id}`);
}

export async function markBookingCompleted(bookingId: string) {
  const user = await requireUser("TUTOR");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { tutor: true },
  });
  if (!booking || booking.tutor.userId !== user.id) {
    throw new Error("Booking not found.");
  }
  if (booking.status !== "CONFIRMED") {
    throw new Error("Only confirmed bookings can be marked complete.");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });

  revalidatePath("/tutor-dashboard/bookings");
  revalidatePath("/dashboard/bookings");
}
