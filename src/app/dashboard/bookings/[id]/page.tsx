import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatCurrencyGBP, formatDate, formatLevel, formatTokenQuantity } from "@/lib/utils";
import { SESSION_MODE_LABELS, formatSessionDuration } from "@/lib/constants";

export const metadata: Metadata = { title: "Booking Details" };
export const dynamic = "force-dynamic";

export default async function ClientBookingDetailPage({
  params,
}: PageProps<"/dashboard/bookings/[id]">) {
  const user = await requireUser("CLIENT");
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { tutor: { include: { user: { select: { name: true, email: true } } } } },
  });
  if (!booking || booking.clientId !== user.id) notFound();

  return (
    <div className="max-w-2xl space-y-6">
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
              <dt className="text-navy/50">Lesson date</dt>
              <dd className="font-medium text-navy">{formatDate(booking.startsAt)}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Level</dt>
              <dd className="font-medium text-navy">{formatLevel(booking.level)}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Session mode</dt>
              <dd className="font-medium text-navy">{SESSION_MODE_LABELS[booking.sessionMode]}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Session length</dt>
              <dd className="font-medium text-navy">
                {formatSessionDuration(
                  (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000,
                )}
              </dd>
            </div>
            {booking.examBoard && (
              <div>
                <dt className="text-navy/50">Exam board</dt>
                <dd className="font-medium text-navy">{booking.examBoard}</dd>
              </div>
            )}
            <div>
              <dt className="text-navy/50">Tokens used</dt>
              <dd className="font-medium text-navy">
                {formatTokenQuantity(booking.tokensUsed)} ({formatCurrencyGBP(booking.pricePence)})
              </dd>
            </div>
          </dl>

          {booking.notes && (
            <div>
              <p className="text-sm text-navy/50">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{booking.notes}</p>
            </div>
          )}

          {booking.status === "CANCELLED_BY_TUTOR" && booking.cancellationReason && (
            <p className="text-sm text-red">
              Undone by your tutor: {booking.cancellationReason}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
