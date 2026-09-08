"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";
import { region } from "@/lib/region";

const startConversationSchema = z.object({
  clientId: z.string().min(1),
  tutorProfileId: z.string().min(1),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

// Lets admin open a channel between a specific client and tutor so the
// tutor can reach out first — e.g. a client enquired by email rather than
// through the platform. Deliberately a one-at-a-time, admin-judgement
// action rather than something bulk or client-facing.
export async function adminStartConversation(
  input: StartConversationInput,
): Promise<{ error: string; conversationId?: undefined } | { error?: undefined; conversationId: string }> {
  const admin = await requireUser("ADMIN");
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { clientId, tutorProfileId, note } = parsed.data;

  const [client, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId } }),
    prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);
  if (!client || client.role !== "CLIENT") return { error: "Client not found." };
  if (!profile) return { error: "Tutor not found." };

  const conversation = await prisma.conversation.upsert({
    where: { clientId_tutorProfileId: { clientId, tutorProfileId } },
    update: {},
    create: {
      clientId,
      tutorProfileId,
      tutorUserId: profile.userId,
    },
  });

  await logAudit({
    actorId: admin.id,
    action: "ADMIN_CONVERSATION_STARTED",
    targetType: "Conversation",
    targetId: conversation.id,
    metadata: { clientId, tutorProfileId, note: note || null },
  });

  await sendEmail({
    to: profile.user.email,
    subject: `Please reach out to ${client.name} on ${region.brandName}`,
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(profile.user.name)},</p>
      <p>${region.brandName} has connected you with a client, ${escapeHtml(client.name)}
      — please send them a message to get things started.</p>
      ${note ? `<p><strong>Note from ${region.brandName}:</strong><br />${escapeHtml(note).replace(/\n/g, "<br />")}</p>` : ""}
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tutor-dashboard/messages/${conversation.id}">Message ${escapeHtml(client.name)}</a></p>
    `),
  }).catch(() => {});

  revalidatePath("/admin/messages");
  revalidatePath("/tutor-dashboard/messages");
  revalidatePath(`/tutor-dashboard/messages/${conversation.id}`);

  return { conversationId: conversation.id };
}
