import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyGBP } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin Overview" };
export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [
    pendingApplications,
    totalTutors,
    totalClients,
    upcomingBookings,
    disputedBookings,
    revenueAgg,
  ] = await Promise.all([
    prisma.tutorApplication.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { role: "TUTOR" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.booking.count({ where: { status: "CONFIRMED" } }),
    prisma.booking.count({ where: { status: "DISPUTED" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { platformFeePence: true },
    }),
  ]);

  const stats = [
    {
      label: "Pending tutor applications",
      value: pendingApplications,
      href: "/admin/tutor-applications",
      highlight: pendingApplications > 0,
    },
    { label: "Active tutors", value: totalTutors, href: "/admin/tutors" },
    { label: "Clients", value: totalClients, href: "/admin/clients" },
    {
      label: "Upcoming confirmed bookings",
      value: upcomingBookings,
      href: "/admin/bookings",
    },
    {
      label: "Disputed bookings",
      value: disputedBookings,
      href: "/admin/bookings?status=DISPUTED",
      highlight: disputedBookings > 0,
    },
    {
      label: "Total platform revenue",
      value: formatCurrencyGBP(revenueAgg._sum.platformFeePence ?? 0),
      href: "/admin/revenue",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card
            className={
              "highlight" in stat && stat.highlight
                ? "border-gold-dark/50 bg-gold/5"
                : undefined
            }
          >
            <CardContent>
              <p className="text-sm text-navy/60">{stat.label}</p>
              <p className="mt-2 font-heading text-3xl font-bold text-navy">
                {stat.value}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
