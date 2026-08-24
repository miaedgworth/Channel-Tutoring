import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleLessonForm } from "@/components/tutor-dashboard/schedule-lesson-form";

export const metadata: Metadata = { title: "Schedule a Lesson" };
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
            messages you and you&apos;ve agreed a time, come back here to
            schedule the lesson.{" "}
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
          Schedule a Lesson
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Once you and a client have agreed a time, schedule it here.
          They&apos;ll be asked to use their credit balance to confirm it.
        </p>
        <div className="mt-6">
          <ScheduleLessonForm
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
