import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma, type Level } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { logAudit } from "@/lib/audit";
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
      // checkout.session.completed can fire before payment actually
      // clears for delayed/async payment methods — only credit tokens
      // once Stripe confirms the payment itself succeeded.
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

      const userId = session.metadata.userId;
      const level = session.metadata.level as Level | undefined;
      const quantity = Number(session.metadata.quantity);
      if (!level || !Number.isInteger(quantity) || quantity <= 0) {
        await logAudit({
          action: "STRIPE_WEBHOOK_METADATA_INVALID",
          targetType: "CheckoutSession",
          targetId: session.id,
          metadata: { rawMetadata: session.metadata },
        });
        return NextResponse.json({ received: true });
      }

      const existing = await prisma.tokenTransaction.findFirst({
        where: { stripeCheckoutSessionId: session.id },
      });
      if (existing) {
        return NextResponse.json({ received: true });
      }

      let user;
      try {
        user = await prisma.$transaction(async (tx) => {
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
          await tx.tokenBalance.upsert({
            where: { userId_level: { userId, level } },
            create: { userId, level, balance: quantity },
            update: { balance: { increment: quantity } },
          });
          return tx.user.findUniqueOrThrow({ where: { id: userId } });
        });
      } catch (err) {
        // A unique-constraint hit on stripeCheckoutSessionId means Stripe
        // redelivered this event and another request already processed
        // it — this is expected under Stripe's at-least-once delivery,
        // not an error, so acknowledge instead of double-crediting.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return NextResponse.json({ received: true });
        }
        throw err;
      }

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
