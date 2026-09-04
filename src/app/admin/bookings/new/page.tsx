import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AdminNewSessionTabs } from "@/components/admin/admin-new-session-tabs";

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
          Schedule or Log a Session
        </h2>
        {clients.length === 0 || tutors.length === 0 ? (
          <p className="mt-4 text-sm text-navy/60">
            You need at least one client and one tutor account before you
            can schedule or log a session.
          </p>
        ) : (
          <div className="mt-4">
            <AdminNewSessionTabs clients={clients} tutors={tutors} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
