import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Message Oversight" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { lastMessageAt: "desc" },
    include: {
      client: { select: { name: true } },
      tutorUser: { select: { name: true } },
      _count: { select: { messages: { where: { flagged: true } } } },
    },
    take: 100,
  });

  return (
    <div>
      <p className="mb-4 text-sm text-navy/60">
        All client &harr; tutor conversations, for safeguarding oversight.
        Flagged messages may contain contact details or requests to
        communicate off-platform.
      </p>

      {conversations.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">No conversations yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((c) => (
            <Link key={c.id} href={`/admin/messages/${c.id}`}>
              <Card className="transition-colors hover:border-navy/30">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy">
                      {c.client.name} &harr; {c.tutorUser.name}
                    </p>
                    <p className="text-sm text-navy/50">
                      Last message {formatDateTime(c.lastMessageAt)}
                    </p>
                  </div>
                  {c._count.messages > 0 && (
                    <Badge variant="danger">
                      {c._count.messages} flagged
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
