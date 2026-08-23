import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/button";
import { formatCurrencyGBP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Revenue" };
export const dynamic = "force-dynamic";

export default async function AdminRevenuePage() {
  const [totals, payoutsAgg, recentPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountPence: true, platformFeePence: true, tutorAmountPence: true },
      _count: true,
    }),
    prisma.payout.aggregate({
      where: { status: { in: ["PAID", "IN_TRANSIT"] } },
      _sum: { amountPence: true },
    }),
    prisma.payment.findMany({
      where: { status: "SUCCEEDED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        booking: {
          include: {
            client: { select: { name: true } },
            tutor: { include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <LinkButton href="/api/admin/export/revenue" variant="outline" size="sm">
          Export CSV
        </LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Total platform fees collected</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrencyGBP(totals._sum.platformFeePence ?? 0)}
            </p>
            <p className="mt-1 text-xs text-navy/40">{totals._count} completed sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Total paid to tutors</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrencyGBP(totals._sum.tutorAmountPence ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">Total processed volume</p>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrencyGBP(totals._sum.amountPence ?? 0)}
            </p>
            <p className="mt-1 text-xs text-navy/40">
              {formatCurrencyGBP(payoutsAgg._sum.amountPence ?? 0)} withdrawn by tutors
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="overflow-x-auto">
          <h2 className="mb-3 font-heading text-lg font-semibold text-navy">
            Recent completed sessions
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-left text-navy/50">
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Client</th>
                <th className="pb-2 font-medium">Tutor</th>
                <th className="pb-2 text-right font-medium">Total</th>
                <th className="pb-2 text-right font-medium">Fee</th>
                <th className="pb-2 text-right font-medium">Tutor payout</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.map((p) => (
                <tr key={p.id} className="border-b border-navy/5">
                  <td className="py-2.5 text-navy/60">{formatDate(p.createdAt)}</td>
                  <td className="py-2.5 text-navy">{p.booking.client.name}</td>
                  <td className="py-2.5 text-navy">{p.booking.tutor.user.name}</td>
                  <td className="py-2.5 text-right text-navy">
                    {formatCurrencyGBP(p.amountPence)}
                  </td>
                  <td className="py-2.5 text-right text-gold-dark">
                    {formatCurrencyGBP(p.platformFeePence)}
                  </td>
                  <td className="py-2.5 text-right text-navy">
                    {formatCurrencyGBP(p.tutorAmountPence)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {recentPayments.length === 0 && (
            <p className="py-6 text-center text-sm text-navy/50">No revenue yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
