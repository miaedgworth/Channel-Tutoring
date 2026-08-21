import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { createBookingSchema } from "@/lib/validations/booking";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { PLATFORM_FEE_PENCE } from "@/lib/constants";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await requireUser("CLIENT");

  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`bookings:${user.id}:${ip}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { slotId, subject, level, examBoard, notes } = parsed.data;

  const slot = await prisma.tutorAvailabilitySlot.findUnique({
    where: { id: slotId },
    include: { tutor: { include: { user: true } } },
  });

  if (!slot || slot.isBooked || slot.startsAt.getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This slot is no longer available." },
      { status: 409 },
    );
  }
  if (!slot.tutor.isPublished) {
    return NextResponse.json({ error: "This tutor is not available for booking." }, { status: 409 });
  }
  if (!slot.tutor.stripeOnboardingComplete || !slot.tutor.stripeConnectAccountId) {
    return NextResponse.json(
      { error: "This tutor hasn't finished setting up payouts yet. Please try again later." },
      { status: 409 },
    );
  }

  const durationMinutes = Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000);
  const pricePence = Math.round((slot.tutor.hourlyRatePence * durationMinutes) / 60);
  const platformFeePence = PLATFORM_FEE_PENCE;
  const tutorPayoutPence = pricePence - platformFeePence;

  if (tutorPayoutPence <= 0) {
    return NextResponse.json(
      { error: "This session's price doesn't cover the platform fee. Please contact the tutor." },
      { status: 409 },
    );
  }

  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      const freshSlot = await tx.tutorAvailabilitySlot.findUnique({ where: { id: slotId } });
      if (!freshSlot || freshSlot.isBooked) {
        throw new Error("SLOT_TAKEN");
      }

      await tx.tutorAvailabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true },
      });

      return tx.booking.create({
        data: {
          clientId: user.id,
          tutorId: slot.tutorId,
          slotId,
          subject,
          level,
          examBoard: examBoard || null,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
          pricePence,
          platformFeePence,
          tutorPayoutPence,
          notes: notes || null,
          status: "PENDING_PAYMENT",
        },
      });
    });
  } catch {
    return NextResponse.json(
      { error: "This slot was just booked by someone else. Please pick another." },
      { status: 409 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Payments are not configured in this environment yet. Please set STRIPE_SECRET_KEY to enable checkout.",
      },
      { status: 503 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: pricePence,
          product_data: {
            name: `${subject} (${level === "A_LEVEL" ? "A-Level" : level}) with ${slot.tutor.user.name}`,
            description: `Channel Tutoring session on ${slot.startsAt.toLocaleString("en-GB")}`,
          },
        },
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeePence,
      transfer_data: { destination: slot.tutor.stripeConnectAccountId },
    },
    metadata: { bookingId: booking.id },
    success_url: `${appUrl}/dashboard/bookings/${booking.id}?checkout=success`,
    cancel_url: `${appUrl}/tutors/${slot.tutor.slug}/book?checkout=cancelled`,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
