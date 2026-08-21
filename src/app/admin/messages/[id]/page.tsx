import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { MessageThread } from "@/components/messaging/message-thread";

export const metadata: Metadata = { title: "Conversation" };
export const dynamic = "force-dynamic";

export default async function AdminConversationPage({
  params,
}: PageProps<"/admin/messages/[id]">) {
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      tutorUser: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  return (
    <div className="max-w-2xl overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
      <MessageThread
        conversationId={conversation.id}
        currentUserId=""
        otherPartyName={`${conversation.client.name} ↔ ${conversation.tutorUser.name}`}
        messages={conversation.messages}
        readOnly
      />
    </div>
  );
}
