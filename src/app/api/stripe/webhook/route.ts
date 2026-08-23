import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

function bookingIdsFromSession(session: Stripe.Checkout.Session): string[] {
  const raw = session.metadata?.bookingIds ?? session.metadata?.bookingId;
  if (!raw) return [];
  return raw.split(",").filter(Boolean);
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingIds = bookingIdsFromSession(session);
      if (bookingIds.length === 0) break;

      const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds } },
        include: { tutor: { include: { user: true } }, client: true },
      });
      const pendingBookings = bookings.filter((b) => b.status === "PENDING_PAYMENT");
      if (pendingBookings.length === 0) break;

      const paymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : null;

      await prisma.$transaction(
        pendingBookings.flatMap((booking) => [
          prisma.booking.update({
            where: { id: booking.id },
            data: { status: "CONFIRMED", stripePaymentIntentId: paymentIntentId },
          }),
          prisma.payment.create({
            data: {
              bookingId: booking.id,
              stripeCheckoutSessionId: session.id,
              stripePaymentIntentId: paymentIntentId,
              amountPence: booking.pricePence,
              platformFeePence: booking.platformFeePence,
              tutorAmountPence: booking.tutorPayoutPence,
              status: "SUCCEEDED",
            },
          }),
          prisma.tutorProfile.update({
            where: { id: booking.tutorId },
            data: {
              balancePence: { increment: booking.tutorPayoutPence },
              totalEarnedPence: { increment: booking.tutorPayoutPence },
            },
          }),
          prisma.tutorLedgerEntry.create({
            data: {
              tutorId: booking.tutorId,
              type: "EARNING",
              amountPence: booking.tutorPayoutPence,
              bookingId: booking.id,
              description: `${booking.subject} session with ${booking.client.name} on ${booking.startsAt.toLocaleDateString("en-GB")}`,
            },
          }),
        ]),
      );

      const totalPaid = pendingBookings.reduce((sum, b) => sum + b.pricePence, 0);
      const totalDiscount = pendingBookings.reduce((sum, b) => sum + b.discountPence, 0);
      const first = pendingBookings[0];

      await Promise.all([
        sendEmail({
          to: first.client.email,
          subject:
            pendingBookings.length > 1
              ? `Your ${pendingBookings.length} Channel Tutoring sessions are confirmed`
              : "Your Channel Tutoring session is confirmed",
          html: baseEmailLayout(`
            <p>Hi ${first.client.name},</p>
            <p>Your ${first.subject} session${pendingBookings.length > 1 ? "s" : ""} with
            ${first.tutor.user.name} ${pendingBookings.length > 1 ? "are" : "is"} confirmed:</p>
            <ul>
              ${pendingBookings.map((b) => `<li>${formatDateTime(b.startsAt)}</li>`).join("")}
            </ul>
            <p>Amount paid: ${formatCurrencyGBP(totalPaid)}${totalDiscount > 0 ? ` (includes a ${formatCurrencyGBP(totalDiscount)} block-booking discount)` : ""}</p>
            <p>You can view these bookings and message your tutor from your dashboard.</p>
          `),
        }),
        sendEmail({
          to: first.tutor.user.email,
          subject:
            pendingBookings.length > 1
              ? `${pendingBookings.length} new bookings confirmed`
              : "New booking confirmed",
          html: baseEmailLayout(`
            <p>Hi ${first.tutor.user.name},</p>
            <p>You have ${pendingBookings.length > 1 ? `${pendingBookings.length} new confirmed` : "a new confirmed"}
            ${first.subject} session${pendingBookings.length > 1 ? "s" : ""} with ${first.client.name}:</p>
            <ul>
              ${pendingBookings.map((b) => `<li>${formatDateTime(b.startsAt)} &mdash; payout ${formatCurrencyGBP(b.tutorPayoutPence)}</li>`).join("")}
            </ul>
          `),
        }),
      ]).catch(() => {});

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingIds = bookingIdsFromSession(session);
      if (bookingIds.length === 0) break;

      const bookings = await prisma.booking.findMany({
        where: { id: { in: bookingIds }, status: "PENDING_PAYMENT" },
      });
      if (bookings.length === 0) break;

      await prisma.$transaction([
        prisma.booking.updateMany({
          where: { id: { in: bookings.map((b) => b.id) } },
          data: { status: "CANCELLED_BY_CLIENT", cancellationReason: "Checkout expired" },
        }),
        prisma.tutorAvailabilitySlot.updateMany({
          where: { id: { in: bookings.map((b) => b.slotId).filter((id): id is string => !!id) } },
          data: { isBooked: false },
        }),
      ]);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
