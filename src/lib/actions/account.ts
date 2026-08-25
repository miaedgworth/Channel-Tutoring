"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { updateAccountSchema, changePasswordSchema } from "@/lib/validations/account";
import { subscribeEmail, unsubscribeEmailForUser } from "@/lib/newsletter";

export async function updateAccount(input: {
  name: string;
  phone: string;
  newsletterOptIn: boolean;
}): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser();
  const parsed = updateAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, phone, newsletterOptIn } = parsed.data;

  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: phone || null, newsletterOptIn },
  });

  if (newsletterOptIn) {
    await subscribeEmail(user.email, "account-settings").catch(() => {});
  } else {
    await unsubscribeEmailForUser(user.email).catch(() => {});
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/tutor-dashboard/settings");
  revalidatePath("/admin/settings");

  return {};
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) return { error: "User not found." };

  const valid = await bcrypt.compare(parsed.data.currentPassword, dbUser.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return {};
}
