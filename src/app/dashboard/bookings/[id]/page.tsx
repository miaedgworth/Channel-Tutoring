import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { formatCurrencyGBP, formatDateTime, formatLevel } from "@/lib/utils";

export const metadata: Metadata = { title: "Booking Details" };
export const dynamic = "force-dynamic";

export default async function ClientBookingDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/bookings/[id]">) {
  const user = await requireUser("CLIENT");
  const { id } = await params;
  const search = await searchParams;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { tutor: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!booking || booking.clientId !== user.id) notFound();

  const canCancel = ["PENDING_PAYMENT", "CONFIRMED"].includes(booking.status);

  return (
    <div className="max-w-2xl space-y-6">
      {search.checkout === "success" && booking.status === "PENDING_PAYMENT" && (
        <div className="rounded-md bg-gold/10 px-4 py-3 text-sm text-navy">
          Payment received — we&apos;re confirming your booking. This page
          will update automatically once confirmed.
        </div>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              {booking.subject} with {booking.tutor.user.name}
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
              <dd className="font-medium text-navy">{formatLevel(booking.level)}</dd>
            </div>
            {booking.examBoard && (
              <div>
                <dt className="text-navy/50">Exam board</dt>
                <dd className="font-medium text-navy">{booking.examBoard}</dd>
              </div>
            )}
            <div>
              <dt className="text-navy/50">Price paid</dt>
              <dd className="font-medium text-navy">{formatCurrencyGBP(booking.pricePence)}</dd>
            </div>
            {booking.discountPence > 0 && (
              <div>
                <dt className="text-navy/50">Block-booking discount</dt>
                <dd className="font-medium text-emerald-700">
                  &minus;{formatCurrencyGBP(booking.discountPence)}
                </dd>
              </div>
            )}
          </dl>

          {booking.notes && (
            <div>
              <p className="text-sm text-navy/50">Your notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{booking.notes}</p>
            </div>
          )}

          {booking.status === "CANCELLED_BY_CLIENT" ||
          booking.status === "CANCELLED_BY_TUTOR" ? (
            booking.cancellationReason && (
              <p className="text-sm text-red">
                Cancellation reason: {booking.cancellationReason}
              </p>
            )
          ) : null}
        </CardContent>
      </Card>

      {canCancel && <CancelBookingButton bookingId={booking.id} />}
    </div>
  );
}
