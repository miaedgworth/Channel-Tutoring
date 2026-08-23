"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatDateTime } from "@/lib/utils";

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
  // Tutor-initiated cancellations are always refunded in full; client
  // cancellations are only refunded outside the 24-hour window.
  const shouldRefund = booking.status === "CONFIRMED" && (isTutor || withinFreeWindow);

  if (shouldRefund && booking.payment?.stripePaymentIntentId && isStripeConfigured()) {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: booking.payment.stripePaymentIntentId,
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
        data: { status: "REFUNDED", refundedPence: booking.payment.amountPence },
      });
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
          description: `Refund for cancelled ${booking.subject} session on ${booking.startsAt.toLocaleDateString("en-GB")}`,
        },
      });
    }
  });

  await logAudit({
    actorId: user.id,
    action: isTutor ? "BOOKING_CANCELLED_BY_TUTOR" : "BOOKING_CANCELLED_BY_CLIENT",
    targetType: "Booking",
    targetId: booking.id,
    metadata: { reason: reason ?? null, refunded: shouldRefund },
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
      ${shouldRefund ? "<p>A full refund has been issued.</p>" : ""}
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
