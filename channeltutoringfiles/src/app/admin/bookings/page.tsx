import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Bookings" };
export const dynamic = "force-dynamic";

const STATUSES: BookingStatus[] = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED_BY_CLIENT",
  "CANCELLED_BY_TUTOR",
  "REFUNDED",
  "DISPUTED",
];

export default async function AdminBookingsPage({
  searchParams,
}: PageProps<"/admin/bookings">) {
  const { status } = await searchParams;
  const statusFilter =
    typeof status === "string" && STATUSES.includes(status as BookingStatus)
      ? (status as BookingStatus)
      : undefined;

  const bookings = await prisma.booking.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    orderBy: { startsAt: "desc" },
    take: 100,
    include: {
      client: { select: { name: true } },
      tutor: { include: { user: { select: { name: true } } } },
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/bookings"
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              !statusFilter ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            }`}
          >
            All
          </Link>
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/bookings?status=${s}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusFilter === s ? "bg-navy text-white" : "bg-navy/5 text-navy/70 hover:bg-navy/10"
              }`}
            >
              {s.replaceAll("_", " ")}
            </Link>
          ))}
        </div>
        <LinkButton href="/api/admin/export/bookings" variant="outline" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Tutor</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-navy/5">
                  <td className="py-2.5 text-navy/60">{formatDateTime(booking.startsAt)}</td>
                  <td className="py-2.5 text-navy">{booking.client.name}</td>
                  <td className="py-2.5 text-navy">{booking.tutor.user.name}</td>
                  <td className="py-2.5 text-navy/70">{booking.subject}</td>
                  <td className="py-2.5">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="py-2.5 text-right font-medium text-navy">
                    {formatCurrencyGBP(booking.pricePence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && (
            <p className="py-6 text-center text-sm text-navy/50">No bookings found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
