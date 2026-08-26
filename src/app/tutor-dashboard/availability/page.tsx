import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityGrid } from "@/components/tutor-dashboard/availability-grid";

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
    where: { tutorId: profile.id },
  });

  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">
          Weekly availability
        </h2>
        <p className="mt-1 text-sm text-navy/60">
          Tick the days and times of day you&apos;re generally free — this
          repeats every week. Clients will message you to agree an exact
          time, and you then schedule the lesson from your{" "}
          <Link href="/tutor-dashboard/bookings" className="underline">
            Bookings
          </Link>{" "}
          page.
        </p>
        <div className="mt-4">
          <AvailabilityGrid slots={slots} />
        </div>
      </CardContent>
    </Card>
  );
}
