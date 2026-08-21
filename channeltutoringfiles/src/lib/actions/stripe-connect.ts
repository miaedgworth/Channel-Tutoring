"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";

export async function createConnectOnboardingLink(): Promise<string> {
  const user = await requireUser("TUTOR");
  if (!isStripeConfigured()) {
    throw new Error("Payments are not configured in this environment yet.");
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  let accountId = profile.stripeConnectAccountId;
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: user.email,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      settings: {
        payouts: { schedule: { interval: "manual" } },
      },
    });
    accountId = account.id;
    await prisma.tutorProfile.update({
      where: { id: profile.id },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/tutor-dashboard/earnings?onboarding=refresh`,
    return_url: `${appUrl}/tutor-dashboard/earnings?onboarding=return`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function refreshConnectStatus() {
  const user = await requireUser("TUTOR");
  if (!isStripeConfigured()) return;

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile?.stripeConnectAccountId || profile.stripeOnboardingComplete) return;

  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(profile.stripeConnectAccountId);

  if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
    await prisma.tutorProfile.update({
      where: { id: profile.id },
      data: { stripeOnboardingComplete: true },
    });
  }

  revalidatePath("/tutor-dashboard/earnings");
}

export async function requestPayout() {
  const user = await requireUser("TUTOR");
  if (!isStripeConfigured()) {
    throw new Error("Payments are not configured in this environment yet.");
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");
  if (!profile.stripeConnectAccountId || !profile.stripeOnboardingComplete) {
    throw new Error("Finish connecting your bank account before withdrawing.");
  }
  if (profile.balancePence <= 0) {
    throw new Error("You don't have any balance to withdraw.");
  }

  const stripe = getStripe();
  const amount = profile.balancePence;

  const payoutRecord = await prisma.payout.create({
    data: { tutorId: profile.id, amountPence: amount, status: "PENDING" },
  });

  try {
    const stripePayout = await stripe.payouts.create(
      { amount, currency: "gbp" },
      { stripeAccount: profile.stripeConnectAccountId },
    );

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: stripePayout.status === "paid" ? "PAID" : "IN_TRANSIT",
          stripeTransferId: stripePayout.id,
          paidAt: stripePayout.status === "paid" ? new Date() : null,
        },
      }),
      prisma.tutorProfile.update({
        where: { id: profile.id },
        data: { balancePence: { decrement: amount } },
      }),
      prisma.tutorLedgerEntry.create({
        data: {
          tutorId: profile.id,
          type: "PAYOUT",
          amountPence: -amount,
          payoutId: payoutRecord.id,
          description: "Withdrawal to bank account",
        },
      }),
    ]);
  } catch (err) {
    await prisma.payout.update({
      where: { id: payoutRecord.id },
      data: {
        status: "FAILED",
        failureReason: err instanceof Error ? err.message : "Unknown error",
      },
    });
    throw new Error("Withdrawal failed. Please try again or contact support.");
  }

  await logAudit({
    actorId: user.id,
    action: "TUTOR_PAYOUT_REQUESTED",
    targetType: "Payout",
    targetId: payoutRecord.id,
    metadata: { amountPence: amount },
  });

  revalidatePath("/tutor-dashboard/earnings");
}
