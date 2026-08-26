import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { NewSessionTabs } from "@/components/tutor-dashboard/new-session-tabs";

export const metadata: Metadata = { title: "Schedule or Log a Session" };
export const dynamic = "force-dynamic";

export default async function ScheduleLessonPage({
  searchParams,
}: PageProps<"/tutor-dashboard/bookings/new">) {
  const user = await requireUser("TUTOR");
  const search = await searchParams;
  const clientIdParam = Array.isArray(search.clientId) ? search.clientId[0] : search.clientId;

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">Tutor profile not found.</p>
        </CardContent>
      </Card>
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: { tutorProfileId: profile.id },
    orderBy: { lastMessageAt: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });

  if (conversations.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            You don&apos;t have any client conversations yet. Once a client
            messages you, come back here to schedule a session with them or
            log one you&apos;ve already taught.{" "}
            <Link href="/tutor-dashboard/messages" className="underline">
              View messages
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">
          Schedule or Log a Session
        </h2>
        <div className="mt-4">
          <NewSessionTabs
            clients={conversations.map((c) => c.client)}
            subjects={profile.subjects}
            levels={profile.levels}
            sessionMode={profile.sessionMode}
            preselectedClientId={clientIdParam}
          />
        </div>
      </CardContent>
    </Card>
  );
}
