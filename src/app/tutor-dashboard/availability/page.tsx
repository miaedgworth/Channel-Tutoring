import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityForm } from "@/components/tutor-dashboard/availability-form";
import { AvailabilityList } from "@/components/tutor-dashboard/availability-list";

export const metadata: Metadata = { title: "My Availability" };
export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await requireUser("TUTOR");
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodOrder: Record<string, number> = { MORNING: 0, AFTERNOON: 1, EVENING: 2 };
  const slots = (
    await prisma.tutorAvailabilitySlot.findMany({
      where: { tutorId: profile.id, date: { gte: today } },
      orderBy: { date: "asc" },
    })
  ).sort((a, b) => a.date.getTime() - b.date.getTime() || periodOrder[a.period] - periodOrder[b.period]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Add availability
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Let clients know which days and times of day you&apos;re generally
            free — morning, afternoon or evening. Clients will message you to
            agree an exact time, and you then schedule the lesson from your{" "}
            <Link href="/tutor-dashboard/bookings" className="underline">
              Bookings
            </Link>{" "}
            page.
          </p>
          <div className="mt-4">
            <AvailabilityForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Upcoming slots
          </h2>
          <div className="mt-4">
            <AvailabilityList slots={slots} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
