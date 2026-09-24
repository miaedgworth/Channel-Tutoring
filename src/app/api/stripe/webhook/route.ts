import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { Prisma, type Level } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { formatLevel, formatCurrency, formatDate, escapeHtml } from "@/lib/utils";
import { reserveTokensForUnpaidBookings } from "@/lib/actions/token-reservation";
import { region } from "@/lib/region";

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
          // Catch up any still-unpaid recurring sessions at this level now
          // that the client has more tokens.
          await reserveTokensForUnpaidBookings(tx, userId, level);
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
        subject: `Your ${region.brandName} tokens are ready`,
        html: baseEmailLayout(`
          <p>Hi ${user.name},</p>
          <p>You've added ${quantity} ${formatLevel(level)} lesson token${quantity > 1 ? "s" : ""}
          to your account. Message a tutor to arrange a lesson — they'll log
          it once it's taught and a token will be used automatically.</p>
        `),
      }).catch(() => {});
    }

    if (session.metadata?.type === "course_deposit" && session.metadata.enrollmentId) {
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }
      await handleCourseDepositPaid(session);
    }

    if (session.metadata?.type === "course_balance" && session.metadata.enrollmentId) {
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }
      await handleCourseBalancePaid(session);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCourseDepositPaid(session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata!.enrollmentId!;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true, client: true, days: { include: { day: true } } },
  });
  if (!enrollment) {
    await logAudit({
      action: "STRIPE_WEBHOOK_METADATA_INVALID",
      targetType: "CheckoutSession",
      targetId: session.id,
      metadata: { rawMetadata: session.metadata },
    });
    return;
  }
  // Idempotent: a redelivered event, or the deposit already recorded via
  // another route, should never be applied twice.
  if (enrollment.depositStatus === "PAID") return;

  try {
    await prisma.courseEnrollment.update({
      where: { id: enrollmentId, depositStatus: "PENDING" },
      data: {
        depositStatus: "PAID",
        depositPaidAt: new Date(),
        depositCheckoutSessionId: session.id,
        status: "DEPOSIT_PAID",
      },
    });
  } catch (err) {
    // P2025 here means depositStatus was no longer PENDING when the update
    // ran (a redelivered webhook racing an earlier one) — already handled.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return;
    }
    throw err;
  }

  const contactEmail = enrollment.client?.email ?? enrollment.guestEmail;
  const contactName = enrollment.client?.name ?? enrollment.guestName ?? "there";
  if (!contactEmail) return;

  const dayLabels = enrollment.days.map((d) => d.day.label).join(", ");
  const manageLink = enrollment.clientId
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses`
    : `${process.env.NEXT_PUBLIC_APP_URL}/courses/pay-balance/${enrollment.id}`;
  await sendEmail({
    to: contactEmail,
    subject: `Your place on ${enrollment.course.title} is booked`,
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(contactName)},</p>
      <p>Thanks — we've received the deposit of ${formatCurrency(enrollment.depositPence)}
      for ${enrollment.childName}'s place on <strong>${enrollment.course.title}</strong>
      (${dayLabels}).</p>
      <p>The remaining balance of ${formatCurrency(enrollment.balancePence)} is due
      ${enrollment.course.balanceDueDate ? `by ${formatDate(enrollment.course.balanceDueDate)}` : "shortly"}.
      We'll email you a payment link nearer the time — you can also pay early any time
      ${enrollment.clientId ? "from your dashboard" : "using the link below"}.</p>
      <p><a href="${manageLink}">${enrollment.clientId ? "View your booking" : "Manage your booking"}</a></p>
    `),
  }).catch(() => {});
}

async function handleCourseBalancePaid(session: Stripe.Checkout.Session) {
  const enrollmentId = session.metadata!.enrollmentId!;

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true, client: true },
  });
  if (!enrollment) {
    await logAudit({
      action: "STRIPE_WEBHOOK_METADATA_INVALID",
      targetType: "CheckoutSession",
      targetId: session.id,
      metadata: { rawMetadata: session.metadata },
    });
    return;
  }
  if (enrollment.balanceStatus === "PAID") return;

  try {
    await prisma.courseEnrollment.update({
      where: { id: enrollmentId, balanceStatus: "PENDING" },
      data: {
        balanceStatus: "PAID",
        balancePaidAt: new Date(),
        balanceCheckoutSessionId: session.id,
        status: "PAID_IN_FULL",
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return;
    }
    throw err;
  }

  const contactEmail = enrollment.client?.email ?? enrollment.guestEmail;
  const contactName = enrollment.client?.name ?? enrollment.guestName ?? "there";
  if (!contactEmail) return;

  await sendEmail({
    to: contactEmail,
    subject: `Balance paid — ${enrollment.course.title}`,
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(contactName)},</p>
      <p>We've received the remaining balance of ${formatCurrency(enrollment.balancePence)}
      for ${enrollment.childName}'s place on <strong>${enrollment.course.title}</strong>.
      Everything's paid in full — see you there!</p>
    `),
  }).catch(() => {});
}
