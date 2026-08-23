import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { createBookingSchema } from "@/lib/validations/booking";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  PLATFORM_FEE_PENCE,
  LEVEL_PRICE_PENCE,
  BLOCK_BOOKING_MIN_SESSIONS,
  BLOCK_BOOKING_DISCOUNT_RATE,
} from "@/lib/constants";
import { formatLevel } from "@/lib/utils";
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

  const { slotIds, subject, level, examBoard, notes } = parsed.data;
  const uniqueSlotIds = Array.from(new Set(slotIds));

  const slots = await prisma.tutorAvailabilitySlot.findMany({
    where: { id: { in: uniqueSlotIds } },
    include: { tutor: { include: { user: true } } },
  });

  if (slots.length !== uniqueSlotIds.length) {
    return NextResponse.json({ error: "One or more slots could not be found." }, { status: 409 });
  }
  const tutorIds = new Set(slots.map((s) => s.tutorId));
  if (tutorIds.size !== 1) {
    return NextResponse.json(
      { error: "All selected sessions must be with the same tutor." },
      { status: 400 },
    );
  }
  if (slots.some((s) => s.isBooked || s.startsAt.getTime() < Date.now())) {
    return NextResponse.json(
      { error: "One or more of these slots is no longer available." },
      { status: 409 },
    );
  }

  const tutor = slots[0].tutor;
  if (!tutor.isPublished) {
    return NextResponse.json({ error: "This tutor is not available for booking." }, { status: 409 });
  }
  if (!tutor.stripeOnboardingComplete || !tutor.stripeConnectAccountId) {
    return NextResponse.json(
      { error: "This tutor hasn't finished setting up payouts yet. Please try again later." },
      { status: 409 },
    );
  }

  const levelPricePence = LEVEL_PRICE_PENCE[level];
  if (!levelPricePence) {
    return NextResponse.json({ error: "Invalid level." }, { status: 400 });
  }

  const applyDiscount = slots.length >= BLOCK_BOOKING_MIN_SESSIONS;

  const bookingsData = slots.map((slot) => {
    const durationMinutes = Math.round((slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000);
    const fullPricePence = Math.round((levelPricePence * durationMinutes) / 60);
    const discountedPricePence = applyDiscount
      ? Math.round(fullPricePence * (1 - BLOCK_BOOKING_DISCOUNT_RATE))
      : fullPricePence;
    const discountPence = fullPricePence - discountedPricePence;
    // The tutor is always paid as if there were no discount; the block
    // booking discount comes entirely out of the platform's fee.
    const tutorPayoutPence = fullPricePence - PLATFORM_FEE_PENCE;
    const platformFeePence = discountedPricePence - tutorPayoutPence;
    return { slot, discountedPricePence, discountPence, platformFeePence, tutorPayoutPence };
  });

  if (bookingsData.some((b) => b.tutorPayoutPence <= 0)) {
    return NextResponse.json(
      { error: "This session's price doesn't cover the platform fee. Please contact us." },
      { status: 409 },
    );
  }
  if (bookingsData.some((b) => b.platformFeePence <= 0)) {
    return NextResponse.json(
      { error: "This discount can't be applied to sessions this short. Please contact us." },
      { status: 409 },
    );
  }

  let bookings;
  try {
    bookings = await prisma.$transaction(async (tx) => {
      const freshSlots = await tx.tutorAvailabilitySlot.findMany({
        where: { id: { in: uniqueSlotIds } },
      });
      if (freshSlots.length !== uniqueSlotIds.length || freshSlots.some((s) => s.isBooked)) {
        throw new Error("SLOT_TAKEN");
      }

      await tx.tutorAvailabilitySlot.updateMany({
        where: { id: { in: uniqueSlotIds } },
        data: { isBooked: true },
      });

      return Promise.all(
        bookingsData.map(({ slot, discountedPricePence, discountPence, platformFeePence, tutorPayoutPence }) =>
          tx.booking.create({
            data: {
              clientId: user.id,
              tutorId: slot.tutorId,
              slotId: slot.id,
              subject,
              level,
              examBoard: examBoard || null,
              startsAt: slot.startsAt,
              endsAt: slot.endsAt,
              pricePence: discountedPricePence,
              discountPence,
              platformFeePence,
              tutorPayoutPence,
              notes: notes || null,
              status: "PENDING_PAYMENT",
            },
          }),
        ),
      );
    });
  } catch {
    return NextResponse.json(
      { error: "One of these slots was just booked by someone else. Please pick again." },
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
  const totalPlatformFeePence = bookings.reduce((sum, b) => sum + b.platformFeePence, 0);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: bookings.map((booking) => ({
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: booking.pricePence,
        product_data: {
          name: `${subject} (${formatLevel(level)}) with ${tutor.user.name}`,
          description: `Channel Tutoring session on ${booking.startsAt.toLocaleString("en-GB")}`,
        },
      },
    })),
    payment_intent_data: {
      application_fee_amount: totalPlatformFeePence,
      transfer_data: { destination: tutor.stripeConnectAccountId },
    },
    metadata: { bookingIds: bookings.map((b) => b.id).join(",") },
    success_url: `${appUrl}/dashboard/bookings/${bookings[0].id}?checkout=success`,
    cancel_url: `${appUrl}/tutors/${tutor.slug}/book?checkout=cancelled`,
  });

  await prisma.booking.updateMany({
    where: { id: { in: bookings.map((b) => b.id) } },
    data: { stripeCheckoutSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
