import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminStartConversationForm } from "@/components/admin/admin-start-conversation-form";

export const metadata: Metadata = { title: "Start a Conversation" };
export const dynamic = "force-dynamic";

export default async function AdminStartConversationPage() {
  const [clients, tutors] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.tutorProfile.findMany({
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">
          Start a Conversation
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Connect a specific client and tutor who haven&apos;t messaged
          before — for example when a client enquired by email rather than
          through the platform. This opens the conversation and asks the
          tutor to reach out first.
        </p>
        <div className="mt-6">
          {clients.length === 0 || tutors.length === 0 ? (
            <p className="text-sm text-navy/60">
              You need at least one client and one tutor account before you
              can start a conversation.
            </p>
          ) : (
            <AdminStartConversationForm clients={clients} tutors={tutors} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
