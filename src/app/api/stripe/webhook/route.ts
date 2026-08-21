import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

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
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) break;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { tutor: { include: { user: true } }, client: true },
      });
      if (!booking || booking.status !== "PENDING_PAYMENT") break;

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: "CONFIRMED",
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        }),
        prisma.payment.create({
          data: {
            bookingId: booking.id,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
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
      ]);

      await Promise.all([
        sendEmail({
          to: booking.client.email,
          subject: "Your Channel Tutoring session is confirmed",
          html: baseEmailLayout(`
            <p>Hi ${booking.client.name},</p>
            <p>Your ${booking.subject} session with ${booking.tutor.user.name} is confirmed
            for ${formatDateTime(booking.startsAt)}.</p>
            <p>Amount paid: ${formatCurrencyGBP(booking.pricePence)}</p>
            <p>You can view this booking and message your tutor from your dashboard.</p>
          `),
        }),
        sendEmail({
          to: booking.tutor.user.email,
          subject: "New booking confirmed",
          html: baseEmailLayout(`
            <p>Hi ${booking.tutor.user.name},</p>
            <p>You have a new confirmed ${booking.subject} session with
            ${booking.client.name} on ${formatDateTime(booking.startsAt)}.</p>
            <p>Your payout for this session: ${formatCurrencyGBP(booking.tutorPayoutPence)}</p>
          `),
        }),
      ]).catch(() => {});

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId;
      if (!bookingId) break;

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.status !== "PENDING_PAYMENT") break;

      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED_BY_CLIENT", cancellationReason: "Checkout expired" },
        }),
        ...(booking.slotId
          ? [
              prisma.tutorAvailabilitySlot.update({
                where: { id: booking.slotId },
                data: { isBooked: false },
              }),
            ]
          : []),
      ]);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
