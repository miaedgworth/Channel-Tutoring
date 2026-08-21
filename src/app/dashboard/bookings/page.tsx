import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "My Bookings" };
export const dynamic = "force-dynamic";

export default async function ClientBookingsPage() {
  const user = await requireUser("CLIENT");

  const bookings = await prisma.booking.findMany({
    where: { clientId: user.id },
    orderBy: { startsAt: "desc" },
    include: { tutor: { include: { user: { select: { name: true } } } } },
  });

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            You haven&apos;t booked any lessons yet.{" "}
            <Link href="/find-a-tutor" className="underline">
              Find a tutor
            </Link>{" "}
            to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}>
          <Card className="transition-colors hover:border-navy/30">
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-navy">
                  {booking.subject} with {booking.tutor.user.name}
                </p>
                <p className="text-sm text-navy/60">
                  {formatDateTime(booking.startsAt)} &middot;{" "}
                  {formatCurrencyGBP(booking.pricePence)}
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
