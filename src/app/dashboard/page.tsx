import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatDateTime, formatTokenQuantity } from "@/lib/utils";

export const metadata: Metadata = { title: "My Dashboard" };
export const dynamic = "force-dynamic";

export default async function ClientOverviewPage() {
  const user = await requireUser("CLIENT");

  const [upcoming, tokenBalances] = await Promise.all([
    prisma.booking.findMany({
      where: { clientId: user.id, status: "CONFIRMED", startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: { tutor: { include: { user: { select: { name: true } } } } },
    }),
    prisma.tokenBalance.findMany({ where: { userId: user.id } }),
  ]);
  const totalTokens = tokenBalances.reduce((sum, b) => sum + Number(b.balance), 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-navy/60">Lesson tokens</p>
            <p className="mt-1 font-heading text-3xl font-bold text-navy">
              {formatTokenQuantity(totalTokens)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/dashboard/tokens" variant="gold" size="sm">
              Buy Tokens
            </LinkButton>
            <LinkButton href="/dashboard/tokens" variant="outline" size="sm">
              View balances &amp; history
            </LinkButton>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-navy">
          Upcoming sessions
        </h2>
        <LinkButton href="/find-a-tutor" variant="gold" size="sm">
          Find a Tutor
        </LinkButton>
      </div>

      {upcoming.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">
              You don&apos;t have any upcoming sessions yet.{" "}
              <Link href="/find-a-tutor" className="underline">
                Browse tutors
              </Link>{" "}
              to book your first lesson.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcoming.map((booking) => (
            <Link key={booking.id} href={`/dashboard/bookings/${booking.id}`}>
              <Card className="transition-colors hover:border-navy/30">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">
                      {booking.subject} with {booking.tutor.user.name}
                    </p>
                    <p className="text-sm text-navy/60">
                      {formatDateTime(booking.startsAt)}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
