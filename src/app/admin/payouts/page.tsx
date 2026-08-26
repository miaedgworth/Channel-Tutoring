import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkPayoutPaidButton } from "@/components/admin/mark-payout-paid-button";
import { formatCurrencyGBP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Payouts" };
export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const [pending, recentlyPaid] = await Promise.all([
    prisma.payout.findMany({
      where: { status: "PENDING" },
      orderBy: { requestedAt: "asc" },
      include: { tutor: { include: { user: { select: { name: true, email: true } } } } },
    }),
    prisma.payout.findMany({
      where: { status: "PAID" },
      orderBy: { paidAt: "desc" },
      take: 20,
      include: { tutor: { include: { user: { select: { name: true } } } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Payouts due
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Pay these tutors by bank transfer every Monday, then mark each
            as paid.
          </p>

          {pending.length === 0 ? (
            <p className="mt-6 text-sm text-navy/50">No payouts pending.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-left text-navy/50">
                    <th className="pb-2 font-medium">Tutor</th>
                    <th className="pb-2 font-medium">Requested</th>
                    <th className="pb-2 font-medium">Pay to</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((payout) => (
                    <tr key={payout.id} className="border-b border-navy/5">
                      <td className="py-2.5">
                        <p className="font-medium text-navy">{payout.tutor.user.name}</p>
                        <p className="text-xs text-navy/40">{payout.tutor.user.email}</p>
                      </td>
                      <td className="py-2.5 text-navy/60">{formatDate(payout.requestedAt)}</td>
                      <td className="py-2.5 text-navy/70">
                        <p>{payout.tutor.bankAccountName}</p>
                        <p className="text-xs text-navy/50">
                          Sort code {payout.tutor.bankSortCode} &middot; Acc{" "}
                          {payout.tutor.bankAccountNumber}
                        </p>
                      </td>
                      <td className="py-2.5 text-right font-medium text-navy">
                        {formatCurrencyGBP(payout.amountPence)}
                      </td>
                      <td className="py-2.5 text-right">
                        <MarkPayoutPaidButton payoutId={payout.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Recently paid
          </h2>
          {recentlyPaid.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">No payouts yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-left text-navy/50">
                    <th className="pb-2 font-medium">Tutor</th>
                    <th className="pb-2 font-medium">Paid</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                    <th className="pb-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyPaid.map((payout) => (
                    <tr key={payout.id} className="border-b border-navy/5">
                      <td className="py-2.5 font-medium text-navy">
                        {payout.tutor.user.name}
                      </td>
                      <td className="py-2.5 text-navy/60">
                        {payout.paidAt ? formatDate(payout.paidAt) : "—"}
                      </td>
                      <td className="py-2.5 text-right text-navy/70">
                        {formatCurrencyGBP(payout.amountPence)}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant="success">Paid</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
