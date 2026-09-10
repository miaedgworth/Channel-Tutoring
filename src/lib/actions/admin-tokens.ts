"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { formatLevel, formatTokenQuantity } from "@/lib/utils";
import { reserveTokensForUnpaidBookings, tryClaimTokens } from "@/lib/actions/token-reservation";
import { region } from "@/lib/region";
import { sendEmail, baseEmailLayout } from "@/lib/email";

const grantTokensSchema = z.object({
  clientUserId: z.string().min(1),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  quantity: z.coerce.number().positive("Enter a positive number of tokens").max(1000),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

const removeTokensSchema = z.object({
  clientUserId: z.string().min(1),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  quantity: z.coerce.number().positive("Enter a positive number of tokens").max(1000),
  reason: z.string().trim().min(1, "Enter a reason for removing these tokens").max(300),
});

export async function adminGrantTokens(
  input: { clientUserId: string; level: string; quantity: number; note?: string },
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");
  const parsed = grantTokensSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientUserId, level, quantity, note } = parsed.data;

  const client = await prisma.user.findUnique({ where: { id: clientUserId } });
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };

  const description = note
    ? `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} added by ${region.brandName} — ${note}`
    : `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} added by ${region.brandName}`;

  await prisma.$transaction(async (tx) => {
    await tx.tokenBalance.upsert({
      where: { userId_level: { userId: clientUserId, level } },
      create: { userId: clientUserId, level, balance: quantity },
      update: { balance: { increment: quantity } },
    });
    await tx.tokenTransaction.create({
      data: {
        userId: clientUserId,
        level,
        type: "ADMIN_GRANT",
        quantity,
        description,
      },
    });
    // Catch up any still-unpaid recurring sessions at this level now that
    // the client has more tokens.
    await reserveTokensForUnpaidBookings(tx, clientUserId, level);
  });

  await logAudit({
    actorId: admin.id,
    action: "TOKENS_GRANTED_BY_ADMIN",
    targetType: "User",
    targetId: clientUserId,
    metadata: { level, quantity, note: note || null },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/dashboard/tokens");

  return {};
}

export async function adminRemoveTokens(
  input: { clientUserId: string; level: string; quantity: number; reason: string },
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");
  const parsed = removeTokensSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientUserId, level, quantity, reason } = parsed.data;

  const client = await prisma.user.findUnique({ where: { id: clientUserId } });
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };

  const description = `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} removed by ${region.brandName} — ${reason}`;

  let removed = false;
  await prisma.$transaction(async (tx) => {
    // Atomic conditional decrement (see tryClaimTokens) — refuses to take
    // the balance negative even under a concurrent change, e.g. the client
    // redeeming a token for a lesson at the same moment.
    removed = await tryClaimTokens(tx, clientUserId, level, quantity);
    if (!removed) return;
    await tx.tokenTransaction.create({
      data: {
        userId: clientUserId,
        level,
        type: "ADMIN_REMOVE",
        quantity: -quantity,
        description,
      },
    });
  });

  if (!removed) {
    const balance = await prisma.tokenBalance.findUnique({
      where: { userId_level: { userId: clientUserId, level } },
    });
    const available = balance ? formatTokenQuantity(balance.balance) : "0";
    return {
      error: `${client.name} only has ${available} ${formatLevel(level)} token${available === "1" ? "" : "s"} — can't remove ${quantity}.`,
    };
  }

  await sendEmail({
    to: client.email,
    subject: `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} removed from your account`,
    html: baseEmailLayout(`
      <p>Hi ${client.name},</p>
      <p>We've removed ${quantity} ${formatLevel(level)} lesson token${quantity === 1 ? "" : "s"} from your account.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have any questions about this, just reply to this email or contact us at
      <a href="mailto:${region.supportEmail}">${region.supportEmail}</a>.</p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "TOKENS_REMOVED_BY_ADMIN",
    targetType: "User",
    targetId: clientUserId,
    metadata: { level, quantity, reason },
  });

  revalidatePath("/admin/clients");
  revalidatePath("/dashboard/tokens");

  return {};
}
