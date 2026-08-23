import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { ConversationList } from "@/components/messaging/conversation-list";

export default async function TutorMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser("TUTOR");

  const conversations = await prisma.conversation.findMany({
    where: { tutorUserId: user.id },
    orderBy: { lastMessageAt: "desc" },
    include: {
      client: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          messages: { where: { readAt: null, senderId: { not: user.id } } },
        },
      },
    },
  });

  const items = conversations.map((c) => ({
    id: c.id,
    otherPartyName: c.client.name,
    lastMessageAt: c.lastMessageAt,
    lastMessagePreview: c.messages[0]?.body ?? null,
    unreadCount: c._count.messages,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-[16rem_1fr]">
        <div className="border-b border-navy/10 sm:border-b-0 sm:border-r">
          <ConversationList basePath="/tutor-dashboard/messages" conversations={items} />
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
