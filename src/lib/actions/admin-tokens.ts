"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { formatLevel } from "@/lib/utils";

const grantTokensSchema = z.object({
  clientUserId: z.string().min(1),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  quantity: z.coerce.number().positive("Enter a positive number of tokens").max(1000),
  note: z.string().trim().max(300).optional().or(z.literal("")),
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
    ? `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} added by Channel Tutoring — ${note}`
    : `${quantity} ${formatLevel(level)} token${quantity === 1 ? "" : "s"} added by Channel Tutoring`;

  await prisma.$transaction([
    prisma.tokenBalance.upsert({
      where: { userId_level: { userId: clientUserId, level } },
      create: { userId: clientUserId, level, balance: quantity },
      update: { balance: { increment: quantity } },
    }),
    prisma.tokenTransaction.create({
      data: {
        userId: clientUserId,
        level,
        type: "ADMIN_GRANT",
        quantity,
        description,
      },
    }),
  ]);

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
