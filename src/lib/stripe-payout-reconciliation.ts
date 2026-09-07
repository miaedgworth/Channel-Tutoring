import type Stripe from "stripe";
import type { Level } from "@prisma/client";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { LEVEL_PRICE_PENCE, PLATFORM_FEE_PENCE } from "@/lib/constants";

export type PayoutListItem = {
  id: string;
  amountPence: number;
  arrivalDate: Date;
  status: string;
};

export async function listRecentStripePayouts(limit = 12): Promise<PayoutListItem[]> {
  const stripe = getStripe();
  const payouts = await stripe.payouts.list({ limit });
  return payouts.data.map((p) => ({
    id: p.id,
    amountPence: p.amount,
    arrivalDate: new Date(p.arrival_date * 1000),
    status: p.status,
  }));
}

export type ReconciliationLine = {
  balanceTransactionId: string;
  chargeId: string;
  grossPence: number;
  stripeFeePence: number;
  netPence: number;
  matched: boolean;
  level?: Level;
  quantity?: number;
  tutorOwedPence?: number;
  platformCutPence?: number;
};

export type OtherLine = {
  balanceTransactionId: string;
  type: string;
  amountPence: number;
  description: string | null;
};

export type PayoutReconciliation = {
  payoutId: string;
  amountPence: number;
  arrivalDate: Date;
  status: string;
  chargeLines: ReconciliationLine[];
  refundLines: OtherLine[];
  otherLines: OtherLine[];
  totals: {
    tutorOwedPence: number;
    platformCutPence: number;
    unmatchedPence: number;
    refundPence: number;
  };
};

// Charges are matched back to the original token purchase by walking
// balance transaction -> Charge -> PaymentIntent -> Checkout Session,
// then looking up the session ID we stored on TokenTransaction when the
// webhook credited the tokens. This works for historical payouts too,
// since none of it depends on data we'd have had to capture in advance.
async function matchChargeToPurchase(
  stripe: Stripe,
  charge: Stripe.Charge,
): Promise<{ level: Level; quantity: number } | null> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);
  if (!paymentIntentId) return null;

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntentId,
    limit: 1,
  });
  const session = sessions.data[0];
  if (!session) return null;

  const tokenTx = await prisma.tokenTransaction.findFirst({
    where: { stripeCheckoutSessionId: session.id, type: "PURCHASE" },
  });
  if (!tokenTx) return null;

  return { level: tokenTx.level, quantity: Number(tokenTx.quantity) };
}

export async function getPayoutReconciliation(payoutId: string): Promise<PayoutReconciliation> {
  const stripe = getStripe();

  const [payout, balanceTransactions] = await Promise.all([
    stripe.payouts.retrieve(payoutId),
    stripe.balanceTransactions
      .list({ payout: payoutId, limit: 100, expand: ["data.source"] })
      .autoPagingToArray({ limit: 1000 }),
  ]);

  const chargeTxs = balanceTransactions.filter((bt) => bt.type === "charge");
  const refundTxs = balanceTransactions.filter(
    (bt) => bt.type === "refund" || bt.type === "payment_refund",
  );
  const otherTxs = balanceTransactions.filter(
    (bt) => bt.type !== "charge" && bt.type !== "refund" && bt.type !== "payment_refund",
  );

  const chargeLines: ReconciliationLine[] = await Promise.all(
    chargeTxs.map(async (bt) => {
      const source = bt.source;
      const charge =
        source && typeof source === "object" && source.object === "charge"
          ? (source as Stripe.Charge)
          : null;

      const base: ReconciliationLine = {
        balanceTransactionId: bt.id,
        chargeId: charge?.id ?? (typeof source === "string" ? source : "unknown"),
        grossPence: bt.amount,
        stripeFeePence: bt.fee,
        netPence: bt.net,
        matched: false,
      };

      const purchase = charge ? await matchChargeToPurchase(stripe, charge) : null;
      if (!purchase) return base;

      const tutorOwedPence = Math.round(
        purchase.quantity * (LEVEL_PRICE_PENCE[purchase.level] - PLATFORM_FEE_PENCE),
      );
      const platformCutPence = bt.net - tutorOwedPence;

      return {
        ...base,
        matched: true,
        level: purchase.level,
        quantity: purchase.quantity,
        tutorOwedPence,
        platformCutPence,
      };
    }),
  );

  const refundLines: OtherLine[] = refundTxs.map((bt) => ({
    balanceTransactionId: bt.id,
    type: bt.type,
    amountPence: bt.amount,
    description: bt.description,
  }));
  const otherLines: OtherLine[] = otherTxs.map((bt) => ({
    balanceTransactionId: bt.id,
    type: bt.type,
    amountPence: bt.amount,
    description: bt.description,
  }));

  const matchedLines = chargeLines.filter((l) => l.matched);
  const unmatchedLines = chargeLines.filter((l) => !l.matched);

  const totals = {
    tutorOwedPence: matchedLines.reduce((sum, l) => sum + (l.tutorOwedPence ?? 0), 0),
    platformCutPence: matchedLines.reduce((sum, l) => sum + (l.platformCutPence ?? 0), 0),
    unmatchedPence: unmatchedLines.reduce((sum, l) => sum + l.netPence, 0),
    refundPence: refundLines.reduce((sum, l) => sum + l.amountPence, 0),
  };

  return {
    payoutId: payout.id,
    amountPence: payout.amount,
    arrivalDate: new Date(payout.arrival_date * 1000),
    status: payout.status,
    chargeLines,
    refundLines,
    otherLines,
    totals,
  };
}
