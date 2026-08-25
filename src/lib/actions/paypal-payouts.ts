"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { isPayPalConfigured, sendPayPalPayout } from "@/lib/paypal";
import { logAudit } from "@/lib/audit";

const emailSchema = z.string().trim().toLowerCase().email();

export async function setPayPalEmail(
  email: string,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { error: "Enter a valid email address." };

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: { paypalEmail: parsed.data },
  });

  revalidatePath("/tutor-dashboard/earnings");

  return {};
}

export async function requestPayPalPayout(): Promise<
  { error: string } | { error?: undefined }
> {
  const user = await requireUser("TUTOR");
  if (!isPayPalConfigured()) {
    return { error: "Payments are not configured in this environment yet." };
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };
  if (!profile.paypalEmail) {
    return { error: "Add your PayPal email address before withdrawing." };
  }
  if (profile.balancePence <= 0) {
    return { error: "You don't have any balance to withdraw." };
  }

  const amount = profile.balancePence;
  const senderBatchId = randomUUID();

  const payoutRecord = await prisma.payout.create({
    data: { tutorId: profile.id, amountPence: amount, status: "PENDING" },
  });

  try {
    const result = await sendPayPalPayout({
      recipientEmail: profile.paypalEmail,
      amountPence: amount,
      note: "Channel Tutoring earnings withdrawal",
      senderBatchId,
    });

    await prisma.$transaction([
      prisma.payout.update({
        where: { id: payoutRecord.id },
        data: {
          status: "PAID",
          paypalBatchId: result.batchId,
          paypalPayoutItemId: result.payoutItemId,
          paidAt: new Date(),
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
          description: "Withdrawal via PayPal",
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
    return { error: "Withdrawal failed. Please try again or contact support." };
  }

  await logAudit({
    actorId: user.id,
    action: "TUTOR_PAYOUT_REQUESTED",
    targetType: "Payout",
    targetId: payoutRecord.id,
    metadata: { amountPence: amount, method: "paypal" },
  });

  revalidatePath("/tutor-dashboard/earnings");

  return {};
}
