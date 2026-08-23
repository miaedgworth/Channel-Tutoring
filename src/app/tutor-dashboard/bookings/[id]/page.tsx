import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { MarkCompletedButton } from "@/components/mark-completed-button";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking Details" };
export const dynamic = "force-dynamic";

export default async function TutorBookingDetailPage({
  params,
}: PageProps<"/tutor-dashboard/bookings/[id]">) {
  const user = await requireUser("TUTOR");
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      tutor: true,
      client: { select: { name: true, email: true } },
    },
  });
  if (!booking || booking.tutor.userId !== user.id) notFound();

  const canCancel = ["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status);
  const canComplete = booking.status === "CONFIRMED" && booking.startsAt < new Date();

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              {booking.subject} with {booking.client.name}
            </h2>
            <BookingStatusBadge status={booking.status} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-navy/50">Date &amp; time</dt>
              <dd className="font-medium text-navy">{formatDateTime(booking.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Level</dt>
              <dd className="font-medium text-navy">
                {booking.level === "A_LEVEL" ? "A-Level" : booking.level}
              </dd>
            </div>
            <div>
              <dt className="text-navy/50">Your payout</dt>
              <dd className="font-medium text-navy">
                {formatCurrencyGBP(booking.tutorPayoutPence)}
              </dd>
            </div>
            <div>
              <dt className="text-navy/50">Client email</dt>
              <dd className="font-medium text-navy">{booking.client.email}</dd>
            </div>
          </dl>

          {booking.notes && (
            <div>
              <p className="text-sm text-navy/50">Client notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        {canComplete && <MarkCompletedButton bookingId={booking.id} />}
        {canCancel && <CancelBookingButton bookingId={booking.id} />}
      </div>
    </div>
  );
}
