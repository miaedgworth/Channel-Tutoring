import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { LinkButton } from "@/components/ui/button";
import { formatCurrencyGBP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

export default async function TutorBookingsPage() {
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

  const bookings = await prisma.booking.findMany({
    where: { tutorId: profile.id },
    orderBy: { startsAt: "desc" },
    include: { client: { select: { name: true } } },
  });

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            No sessions yet. Schedule an upcoming session with a client, or
            log one you&apos;ve already taught, to redeem their token.
          </p>
          <div className="mt-4">
            <LinkButton href="/tutor-dashboard/bookings/new" variant="primary" size="sm">
              Schedule or Log a Session
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LinkButton href="/tutor-dashboard/bookings/new" variant="primary" size="sm">
          Schedule or Log a Session
        </LinkButton>
      </div>
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/tutor-dashboard/bookings/${booking.id}`}>
          <Card className="transition-colors hover:border-navy/30">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-navy">
                  {booking.subject} with {booking.client.name}
                </p>
                <p className="text-sm text-navy/60">
                  {formatDate(booking.startsAt)} &middot;{" "}
                  {formatCurrencyGBP(booking.tutorPayoutPence)} payout
                </p>
              </div>
              <BookingStatusBadge status={booking.status} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
