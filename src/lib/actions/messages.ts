"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { containsContactInfo } from "@/lib/moderation";
import { logAudit } from "@/lib/audit";

export async function getOrCreateConversation(tutorSlug: string): Promise<string> {
  const user = await requireUser("CLIENT");

  const tutor = await prisma.tutorProfile.findUnique({
    where: { slug: tutorSlug, isPublished: true },
  });
  if (!tutor) throw new Error("Tutor not found.");

  const conversation = await prisma.conversation.upsert({
    where: { clientId_tutorProfileId: { clientId: user.id, tutorProfileId: tutor.id } },
    update: {},
    create: {
      clientId: user.id,
      tutorProfileId: tutor.id,
      tutorUserId: tutor.userId,
    },
  });

  return conversation.id;
}

async function assertParticipant(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found.");
  if (conversation.clientId !== userId && conversation.tutorUserId !== userId) {
    throw new Error("You don't have access to this conversation.");
  }
  return conversation;
}

export async function sendMessage(conversationId: string, body: string) {
  const user = await requireUser();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message can't be empty.");
  if (trimmed.length > 4000) throw new Error("Message is too long.");

  await assertParticipant(conversationId, user.id);

  const flagged = containsContactInfo(trimmed);

  await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId: user.id, body: trimmed, flagged },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  if (flagged) {
    await logAudit({
      actorId: user.id,
      action: "MESSAGE_FLAGGED",
      targetType: "Conversation",
      targetId: conversationId,
      metadata: { reason: "possible contact info or off-platform request" },
    });
  }

  revalidatePath(`/dashboard/messages/${conversationId}`);
  revalidatePath(`/tutor-dashboard/messages/${conversationId}`);
}

export async function markConversationRead(conversationId: string) {
  const user = await requireUser();
  await assertParticipant(conversationId, user.id);

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
}
