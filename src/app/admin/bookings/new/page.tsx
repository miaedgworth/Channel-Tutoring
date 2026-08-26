import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminScheduleSessionForm } from "@/components/admin/admin-schedule-session-form";

export const metadata: Metadata = { title: "Schedule a Session" };
export const dynamic = "force-dynamic";

export default async function AdminScheduleSessionPage() {
  const [clients, tutors] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.tutorProfile.findMany({
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        subjects: true,
        levels: true,
        sessionMode: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">
          Schedule a Session
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Manually arrange a session between a client and a tutor — for
          example when a client paid off-platform. This reserves the
          client&apos;s tokens straight away and shows the session as
          upcoming on both the client&apos;s and tutor&apos;s dashboards.
        </p>
        <div className="mt-6">
          {clients.length === 0 || tutors.length === 0 ? (
            <p className="text-sm text-navy/60">
              You need at least one client and one tutor account before you
              can schedule a session.
            </p>
          ) : (
            <AdminScheduleSessionForm clients={clients} tutors={tutors} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
