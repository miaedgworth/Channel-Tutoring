import type { Metadata } from "next";
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

  const slots = await prisma.tutorAvailabilitySlot.findMany({
    where: { tutorId: profile.id, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Add availability
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Add time slots when you&apos;re free to tutor. Clients book directly
            into these slots.
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
