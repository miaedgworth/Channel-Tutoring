import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { MessageThread } from "@/components/messaging/message-thread";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function ClientConversationPage({
  params,
}: PageProps<"/dashboard/messages/[id]">) {
  const user = await requireUser("CLIENT");
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      tutorUser: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || conversation.clientId !== user.id) notFound();

  return (
    <MessageThread
      conversationId={conversation.id}
      currentUserId={user.id}
      otherPartyName={conversation.tutorUser.name}
      messages={conversation.messages}
    />
  );
}
