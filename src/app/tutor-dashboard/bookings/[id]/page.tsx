import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { formatCurrencyGBP, formatDate, formatLevel, formatTokenQuantity } from "@/lib/utils";
import { SESSION_MODE_LABELS, LESSON_LOG_UNDO_WINDOW_MS, formatSessionDuration } from "@/lib/constants";

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

  const canUndo =
    booking.status === "COMPLETED" &&
    !!booking.completedAt &&
    new Date().getTime() - booking.completedAt.getTime() <= LESSON_LOG_UNDO_WINDOW_MS;

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
                )}{" "}
                &middot; {formatTokenQuantity(booking.tokensUsed)} token
                {Number(booking.tokensUsed) === 1 ? "" : "s"}
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
              <p className="text-sm text-navy/50">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">{booking.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {canUndo && (
        <div>
          <CancelBookingButton bookingId={booking.id} />
          <p className="mt-2 text-xs text-navy/40">
            You can undo a logged lesson within 24 hours — this refunds the
            client&apos;s token and reverses your payout.
          </p>
        </div>
      )}
    </div>
  );
}
