"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";

const bankDetailsSchema = z.object({
  bankAccountName: z.string().trim().min(1, "Enter the name on the account"),
  bankSortCode: z
    .string()
    .trim()
    .regex(/^\d{2}-?\d{2}-?\d{2}$/, "Enter a valid 6-digit sort code"),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{8}$/, "Enter a valid 8-digit account number"),
});

export async function setBankDetails(
  input: { bankAccountName: string; bankSortCode: string; bankAccountNumber: string },
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");

  const parsed = bankDetailsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      bankAccountName: parsed.data.bankAccountName,
      bankSortCode: parsed.data.bankSortCode,
      bankAccountNumber: parsed.data.bankAccountNumber,
    },
  });

  revalidatePath("/tutor-dashboard/earnings");

  return {};
}

export async function requestBankPayout(): Promise<
  { error: string } | { error?: undefined }
> {
  const user = await requireUser("TUTOR");

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };
  if (!profile.bankAccountName || !profile.bankSortCode || !profile.bankAccountNumber) {
    return { error: "Add your bank details before withdrawing." };
  }
  if (profile.balancePence <= 0) {
    return { error: "You don't have any balance to withdraw." };
  }

  const existingPending = await prisma.payout.findFirst({
    where: { tutorId: profile.id, status: "PENDING" },
  });
  if (existingPending) {
    return { error: "You already have a withdrawal request being processed." };
  }

  await prisma.payout.create({
    data: { tutorId: profile.id, amountPence: profile.balancePence, status: "PENDING" },
  });

  await logAudit({
    actorId: user.id,
    action: "TUTOR_PAYOUT_REQUESTED",
    targetType: "TutorProfile",
    targetId: profile.id,
    metadata: { amountPence: profile.balancePence, method: "bank_transfer" },
  });

  revalidatePath("/tutor-dashboard/earnings");
  revalidatePath("/admin/payouts");

  return {};
}

export async function markPayoutPaid(
  payoutId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout || payout.status !== "PENDING") {
    return { error: "Payout not found or already processed." };
  }

  await prisma.$transaction([
    prisma.payout.update({
      where: { id: payoutId },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.tutorProfile.update({
      where: { id: payout.tutorId },
      data: { balancePence: { decrement: payout.amountPence } },
    }),
    prisma.tutorLedgerEntry.create({
      data: {
        tutorId: payout.tutorId,
        type: "PAYOUT",
        amountPence: -payout.amountPence,
        payoutId: payout.id,
        description: "Withdrawal via bank transfer",
      },
    }),
  ]);

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_PAYOUT_MARKED_PAID",
    targetType: "Payout",
    targetId: payoutId,
    metadata: { amountPence: payout.amountPence },
  });

  revalidatePath("/admin/payouts");
  revalidatePath("/tutor-dashboard/earnings");

  return {};
}
