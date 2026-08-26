"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { containsContactInfo } from "@/lib/moderation";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import type { Conversation } from "@prisma/client";

export async function getOrCreateConversation(
  tutorSlug: string,
): Promise<
  { error: string; conversationId?: undefined } | { error?: undefined; conversationId: string }
> {
  const user = await requireUser("CLIENT");

  const tutor = await prisma.tutorProfile.findUnique({
    where: { slug: tutorSlug, isPublished: true },
  });
  if (!tutor) return { error: "Tutor not found." };

  const conversation = await prisma.conversation.upsert({
    where: { clientId_tutorProfileId: { clientId: user.id, tutorProfileId: tutor.id } },
    update: {},
    create: {
      clientId: user.id,
      tutorProfileId: tutor.id,
      tutorUserId: tutor.userId,
    },
  });

  return { conversationId: conversation.id };
}

export async function assertParticipant(
  conversationId: string,
  userId: string,
): Promise<
  { error: string; conversation?: undefined } | { error?: undefined; conversation: Conversation }
> {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });
  if (!conversation) return { error: "Conversation not found." };
  if (conversation.clientId !== userId && conversation.tutorUserId !== userId) {
    return { error: "You don't have access to this conversation." };
  }
  return { conversation };
}

export async function sendMessage(
  conversationId: string,
  body: string,
  attachment?: {
    url: string;
    name: string;
    type: string;
    sizeBytes: number;
  },
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser();
  const trimmed = body.trim();
  if (!trimmed && !attachment) return { error: "Message can't be empty." };
  if (trimmed.length > 4000) return { error: "Message is too long." };

  const participant = await assertParticipant(conversationId, user.id);
  if (!participant.conversation) return { error: participant.error ?? "Conversation not found." };
  const conversation = participant.conversation;

  const flagged = containsContactInfo(trimmed);

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        body: trimmed,
        flagged,
        attachmentUrl: attachment?.url,
        attachmentName: attachment?.name,
        attachmentType: attachment?.type,
        attachmentSizeBytes: attachment?.sizeBytes,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  // Alert the tutor immediately the first time a new client messages them —
  // this is a lead, so it doesn't wait for the general unread-message
  // reminder like every other message does. The conditional update below
  // only succeeds for one caller even if the client's first message is
  // submitted twice concurrently (double-click, retry), so the tutor is
  // guaranteed exactly one email rather than racing on a plain count().
  if (user.id === conversation.clientId) {
    const claimed = await prisma.conversation.updateMany({
      where: { id: conversationId, firstClientMessageNotifiedAt: null },
      data: { firstClientMessageNotifiedAt: new Date() },
    });
    if (claimed.count > 0) {
      const tutorUser = await prisma.user.findUnique({
        where: { id: conversation.tutorUserId },
        select: { name: true, email: true },
      });
      if (tutorUser) {
        await sendEmail({
          to: tutorUser.email,
          subject: "New client message on Channel Tutoring",
          html: baseEmailLayout(`
            <p>Hi ${tutorUser.name},</p>
            <p>${user.name} has messaged you for the first time on Channel Tutoring.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tutor-dashboard/messages/${conversationId}">View the conversation</a></p>
          `),
        }).catch(() => {});
      }
    }
  }

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

  return {};
}

export async function markConversationRead(conversationId: string) {
  const user = await requireUser();
  const participant = await assertParticipant(conversationId, user.id);
  if (participant.error) return { error: participant.error };

  await prisma.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return {};
}
