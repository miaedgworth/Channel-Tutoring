import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MIN_TOPUP_PENCE = 1000;
const MAX_TOPUP_PENCE = 100000;

export async function POST(request: Request) {
  const user = await requireUser("CLIENT");

  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`credit-topup:${user.id}:${ip}`, {
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
  const amountPence = Number(body?.amountPence);
  if (
    !Number.isInteger(amountPence) ||
    amountPence < MIN_TOPUP_PENCE ||
    amountPence > MAX_TOPUP_PENCE
  ) {
    return NextResponse.json({ error: "Choose an amount between £10 and £1,000." }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments are not configured in this environment yet." },
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
          unit_amount: amountPence,
          product_data: {
            name: "Channel Tutoring session credit",
            description: "Top up your balance to book lessons with any tutor.",
          },
        },
      },
    ],
    metadata: { type: "credit_topup", userId: user.id },
    success_url: `${appUrl}/dashboard/credit?checkout=success`,
    cancel_url: `${appUrl}/dashboard/credit?checkout=cancelled`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
