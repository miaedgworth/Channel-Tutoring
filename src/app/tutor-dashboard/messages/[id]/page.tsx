import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { MessageThread } from "@/components/messaging/message-thread";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function TutorConversationPage({
  params,
}: PageProps<"/tutor-dashboard/messages/[id]">) {
  const user = await requireUser("TUTOR");
  const { id } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      client: { select: { name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || conversation.tutorUserId !== user.id) notFound();

  return (
    <MessageThread
      conversationId={conversation.id}
      currentUserId={user.id}
      otherPartyName={conversation.client.name}
      messages={conversation.messages}
    />
  );
}
