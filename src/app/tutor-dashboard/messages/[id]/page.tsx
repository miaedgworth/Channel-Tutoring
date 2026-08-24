import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
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
      client: { select: { id: true, name: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation || conversation.tutorUserId !== user.id) notFound();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-navy/10 px-4 py-2">
        <Link
          href={`/tutor-dashboard/bookings/new?clientId=${conversation.client.id}`}
          className="text-sm font-medium text-navy underline"
        >
          Schedule a lesson with {conversation.client.name}
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <MessageThread
          conversationId={conversation.id}
          currentUserId={user.id}
          otherPartyName={conversation.client.name}
          messages={conversation.messages}
        />
      </div>
    </div>
  );
}
