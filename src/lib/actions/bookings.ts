"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDateTime, formatCurrencyGBP } from "@/lib/utils";
import { CANCELLATION_PARTIAL_REFUND_RATE } from "@/lib/constants";

const FREE_CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000;

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

  if (shouldRefund && booking.payment?.stripePaymentIntentId && isStripeConfigured()) {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: booking.payment.stripePaymentIntentId,
      amount: refundAmountPence,
      reason: "requested_by_customer",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: isTutor ? "CANCELLED_BY_TUTOR" : "CANCELLED_BY_CLIENT",
        cancellationReason: reason || null,
        cancelledAt: new Date(),
      },
    });

    if (booking.slotId) {
      await tx.tutorAvailabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });
    }

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
