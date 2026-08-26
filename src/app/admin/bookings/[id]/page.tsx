import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { EditScheduledSessionForm } from "@/components/admin/edit-scheduled-session-form";
import { formatCurrencyGBP, formatDate, formatDateTime, formatLevel, formatTokenQuantity } from "@/lib/utils";
import { SESSION_MODE_LABELS, formatSessionDuration } from "@/lib/constants";

export const metadata: Metadata = { title: "Session Details" };
export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: PageProps<"/admin/bookings/[id]">) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: { select: { name: true, email: true } },
      tutor: { include: { user: { select: { name: true, email: true } } } },
    },
  });
  if (!booking) notFound();

  const durationMinutes = (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60000;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold text-navy">
              {booking.subject} — {booking.client.name} &amp; {booking.tutor.user.name}
            </h2>
            <BookingStatusBadge status={booking.status} />
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-navy/50">
                {booking.status === "CONFIRMED" ? "Scheduled for" : "Date"}
              </dt>
              <dd className="font-medium text-navy">
                {booking.status === "CONFIRMED"
                  ? formatDateTime(booking.startsAt)
                  : formatDate(booking.startsAt)}
              </dd>
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
                {formatSessionDuration(durationMinutes)} &middot;{" "}
                {formatTokenQuantity(booking.tokensUsed)} token
                {Number(booking.tokensUsed) === 1 ? "" : "s"}
              </dd>
            </div>
            <div>
              <dt className="text-navy/50">Client</dt>
              <dd className="font-medium text-navy">{booking.client.email}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Tutor</dt>
              <dd className="font-medium text-navy">{booking.tutor.user.email}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Price</dt>
              <dd className="font-medium text-navy">{formatCurrencyGBP(booking.pricePence)}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Tutor payout</dt>
              <dd className="font-medium text-navy">{formatCurrencyGBP(booking.tutorPayoutPence)}</dd>
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

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Edit Session</h2>
          {booking.status === "CONFIRMED" ? (
            <>
              <p className="mt-1 text-sm text-navy/60">
                Change the date, time, length or other details of this
                upcoming session.
              </p>
              <div className="mt-6">
                <EditScheduledSessionForm
                  bookingId={booking.id}
                  tutorSubjects={booking.tutor.subjects}
                  tutorLevels={booking.tutor.levels}
                  tutorSessionMode={booking.tutor.sessionMode}
                  initial={{
                    subject: booking.subject,
                    level: booking.level,
                    examBoard: booking.examBoard ?? "",
                    sessionMode: booking.sessionMode,
                    startsAt: booking.startsAt.toISOString(),
                    durationMinutes,
                    notes: booking.notes ?? "",
                  }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-navy/60">
              Only sessions that haven&apos;t happened yet (status
              &ldquo;Confirmed&rdquo;) can be edited.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
