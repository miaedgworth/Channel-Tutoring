import { NextResponse } from "next/server";
import type Stripe from "stripe";
import type { Level } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { formatLevel } from "@/lib/utils";

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

    if (session.metadata?.type === "token_purchase" && session.metadata.userId) {
      const userId = session.metadata.userId;
      const level = session.metadata.level as Level | undefined;
      const quantity = Number(session.metadata.quantity);
      if (!level || !Number.isInteger(quantity) || quantity <= 0) {
        return NextResponse.json({ received: true });
      }

      const existing = await prisma.tokenTransaction.findFirst({
        where: { stripeCheckoutSessionId: session.id },
      });
      if (existing) {
        return NextResponse.json({ received: true });
      }

      const user = await prisma.$transaction(async (tx) => {
        await tx.tokenBalance.upsert({
          where: { userId_level: { userId, level } },
          create: { userId, level, balance: quantity },
          update: { balance: { increment: quantity } },
        });
        await tx.tokenTransaction.create({
          data: {
            userId,
            level,
            type: "PURCHASE",
            quantity,
            stripeCheckoutSessionId: session.id,
            description: `Bought ${quantity} ${formatLevel(level)} lesson token${quantity > 1 ? "s" : ""}`,
          },
        });
        return tx.user.findUniqueOrThrow({ where: { id: userId } });
      });

      await sendEmail({
        to: user.email,
        subject: "Your Channel Tutoring tokens are ready",
        html: baseEmailLayout(`
          <p>Hi ${user.name},</p>
          <p>You've added ${quantity} ${formatLevel(level)} lesson token${quantity > 1 ? "s" : ""}
          to your account. Message a tutor to arrange a lesson — they'll log
          it once it's taught and a token will be used automatically.</p>
        `),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ received: true });
}
