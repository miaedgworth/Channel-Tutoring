import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatCurrencyGBP, formatDate, formatDateTime, formatLevel, formatTokenQuantity } from "@/lib/utils";
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
            <div className="flex items-center gap-2">
              {booking.status === "CONFIRMED" && !booking.tokensReserved && (
                <Badge variant="warning">Needs payment</Badge>
              )}
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-navy/50">
                {booking.status === "CONFIRMED" ? "Scheduled for" : "Lesson date"}
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
              <dt className="text-navy/50">
                {booking.tokensReserved ? "Tokens used" : "Tokens needed"}
              </dt>
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

          {booking.status === "CONFIRMED" && booking.tokensReserved && (
            <p className="text-sm text-navy/60">
              This session is scheduled. Your tutor will mark it as complete
              after it takes place — if your plans change, just message
              them to reschedule or cancel.
            </p>
          )}

          {booking.status === "CONFIRMED" && !booking.tokensReserved && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">
                This session is scheduled but not paid for yet — add{" "}
                {formatLevel(booking.level)} tokens to your account before
                the date above so it can go ahead. You&apos;ll get a
                reminder if it&apos;s still unpaid on the day.
              </p>
              <div className="mt-3">
                <LinkButton href="/dashboard/tokens" variant="gold" size="sm">
                  Buy tokens
                </LinkButton>
              </div>
            </div>
          )}

          {booking.status === "CANCELLED_BY_TUTOR" && (
            <p className="text-sm text-red">
              Cancelled by your tutor
              {booking.cancellationReason ? `: ${booking.cancellationReason}` : ""} — your
              tokens have been refunded.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
