"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { region } from "@/lib/region";
import { updateAddressSchema } from "@/lib/validations/account";

// Lets admin enter a client's address directly — e.g. one Mia already has
// on file from before the platform existed — without making the client
// submit it themselves.
export async function adminUpdateClientAddress(
  clientUserId: string,
  input: { addressLine1: string; addressLine2: string; addressTown: string; addressPostcode: string },
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");
  const parsed = updateAddressSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { addressLine1, addressLine2, addressTown, addressPostcode } = parsed.data;

  const client = await prisma.user.findUnique({ where: { id: clientUserId } });
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };

  await prisma.user.update({
    where: { id: clientUserId },
    data: { addressLine1, addressLine2: addressLine2 || null, addressTown, addressPostcode },
  });

  await logAudit({
    actorId: admin.id,
    action: "CLIENT_ADDRESS_SET_BY_ADMIN",
    targetType: "User",
    targetId: clientUserId,
  });

  revalidatePath("/admin/clients");

  return {};
}

// Emails a client asking them to add their address in their dashboard —
// for clients Mia doesn't already have an address on file for.
export async function requestClientAddress(
  clientUserId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const client = await prisma.user.findUnique({ where: { id: clientUserId } });
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };

  await prisma.user.update({
    where: { id: clientUserId },
    data: { addressRequestedAt: new Date() },
  });

  await sendEmail({
    to: client.email,
    subject: `Please add your address on ${region.brandName}`,
    html: baseEmailLayout(`
      <p>Hi ${client.name},</p>
      <p>For in-person sessions, we ask clients to keep an address on file
      — we only share it with your tutor once a session is confirmed.</p>
      <p>Could you add yours in your account settings?</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#C9A227;font-weight:bold;">Add your address</a></p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "CLIENT_ADDRESS_REQUESTED",
    targetType: "User",
    targetId: clientUserId,
  });

  revalidatePath("/admin/clients");

  return {};
}
