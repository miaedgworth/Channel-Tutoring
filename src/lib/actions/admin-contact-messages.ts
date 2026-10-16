"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";

export async function setContactMessageHandled(
  id: string,
  handled: boolean,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");

  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) return { error: "Message not found." };

  await prisma.contactMessage.update({ where: { id }, data: { handled } });

  revalidatePath("/admin/contact-messages");

  return {};
}
