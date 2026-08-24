import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatCurrencyGBP } from "@/lib/utils";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === "credit_topup" && session.metadata.userId) {
      const userId = session.metadata.userId;
      const amountPence = session.amount_total ?? 0;
      if (amountPence <= 0) {
        return NextResponse.json({ received: true });
      }

      const existing = await prisma.creditTransaction.findFirst({
        where: { stripeCheckoutSessionId: session.id },
      });
      if (existing) {
        return NextResponse.json({ received: true });
      }

      const user = await prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          where: { id: userId },
          data: { creditBalancePence: { increment: amountPence } },
        });
        await tx.creditTransaction.create({
          data: {
            userId,
            type: "TOPUP",
            amountPence,
            stripeCheckoutSessionId: session.id,
            description: "Credit top-up",
          },
        });
        return updated;
      });

      await sendEmail({
        to: user.email,
        subject: "Your Channel Tutoring credit top-up is complete",
        html: baseEmailLayout(`
          <p>Hi ${user.name},</p>
          <p>You've added ${formatCurrencyGBP(amountPence)} of credit to your
          Channel Tutoring account. Your new balance is
          ${formatCurrencyGBP(user.creditBalancePence)}.</p>
          <p>Use it to confirm lessons with any tutor from your dashboard.</p>
        `),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
