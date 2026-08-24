import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { formatLevel } from "@/lib/utils";
import {
  LEVEL_PRICE_PENCE,
  BLOCK_BOOKING_MIN_SESSIONS,
  BLOCK_BOOKING_DISCOUNT_RATE,
} from "@/lib/constants";

const VALID_LEVELS = Object.keys(LEVEL_PRICE_PENCE);
const MIN_QUANTITY = 1;
const MAX_QUANTITY = 50;

export async function POST(request: Request) {
  const user = await requireUser("CLIENT");

  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`token-checkout:${user.id}:${ip}`, {
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
  const level = String(body?.level ?? "");
  const quantity = Number(body?.quantity);
  if (!VALID_LEVELS.includes(level)) {
    return NextResponse.json({ error: "Choose a valid level." }, { status: 400 });
  }
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    return NextResponse.json(
      { error: `Choose between ${MIN_QUANTITY} and ${MAX_QUANTITY} tokens.` },
      { status: 400 },
    );
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured in this environment yet." },
      { status: 503 },
    );
  }

  const unitPricePence = LEVEL_PRICE_PENCE[level];
  const fullPricePence = unitPricePence * quantity;
  const applyDiscount = quantity >= BLOCK_BOOKING_MIN_SESSIONS;
  const totalPence = applyDiscount
    ? Math.round(fullPricePence * (1 - BLOCK_BOOKING_DISCOUNT_RATE))
    : fullPricePence;

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
          unit_amount: totalPence,
          product_data: {
            name: `${quantity} ${formatLevel(level)} lesson token${quantity > 1 ? "s" : ""}`,
            description: applyDiscount
              ? `Includes ${Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% block discount`
              : "Redeemable against a lesson at this level with any tutor.",
          },
        },
      },
    ],
    metadata: {
      type: "token_purchase",
      userId: user.id,
      level,
      quantity: String(quantity),
    },
    success_url: `${appUrl}/dashboard/tokens?checkout=success`,
    cancel_url: `${appUrl}/dashboard/tokens?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
