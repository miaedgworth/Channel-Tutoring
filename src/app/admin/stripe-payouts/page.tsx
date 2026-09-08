import type { Metadata } from "next";
import Link from "next/link";
import { isStripeConfigured } from "@/lib/stripe";
import { listRecentStripePayouts, getPayoutReconciliation } from "@/lib/stripe-payout-reconciliation";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate, formatLevel, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Stripe Payouts" };
export const dynamic = "force-dynamic";

export default async function AdminStripePayoutsPage({
  searchParams,
}: PageProps<"/admin/stripe-payouts">) {
  if (!isStripeConfigured()) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            Stripe isn&apos;t configured in this environment, so payout data
            can&apos;t be shown here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const params = await searchParams;
  const selectedPayoutId = typeof params.payoutId === "string" ? params.payoutId : undefined;

  let payouts;
  try {
    payouts = await listRecentStripePayouts();
  } catch (err) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red">
            Couldn&apos;t load payouts from Stripe:{" "}
            {err instanceof Error ? err.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activePayoutId = selectedPayoutId ?? payouts[0]?.id;

  let reconciliation = null;
  let reconciliationError: string | null = null;
  if (activePayoutId) {
    try {
      reconciliation = await getPayoutReconciliation(activePayoutId);
    } catch (err) {
      reconciliationError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  const unmatchedCount = reconciliation?.chargeLines.filter((l) => !l.matched).length ?? 0;
  const matchedLines = reconciliation?.chargeLines.filter((l) => l.matched) ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Recent Stripe payouts
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            This is money Stripe pays into your bank account (not tutor
            withdrawals — see Payouts for those). Select a payout below to
            see how much of it should go into your tutor wages pocket versus
            what you keep as your platform fee.
          </p>
          {payouts.length === 0 ? (
            <p className="mt-4 text-sm text-navy/50">No payouts yet.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {payouts.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/stripe-payouts?payoutId=${p.id}`}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    p.id === activePayoutId
                      ? "border-navy bg-navy text-white"
                      : "border-navy/20 text-navy/70 hover:border-navy/40",
                  )}
                >
                  {formatDate(p.arrivalDate)} &middot; {formatCurrency(p.amountPence)}
                  {p.status !== "paid" ? ` (${p.status})` : ""}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reconciliationError && (
        <Card>
          <CardContent>
            <p className="text-sm text-red">
              Couldn&apos;t load this payout: {reconciliationError}
            </p>
          </CardContent>
        </Card>
      )}

      {reconciliation && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-sm text-navy/60">Total payout</p>
                <p className="mt-2 font-heading text-3xl font-bold text-navy">
                  {formatCurrency(reconciliation.amountPence)}
                </p>
                <p className="mt-1 text-xs text-navy/40">
                  Arriving {formatDate(reconciliation.arrivalDate)} &middot;{" "}
                  {reconciliation.status}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-navy/60">
                  Set aside for tutor wages
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-navy">
                  {formatCurrency(reconciliation.totals.tutorOwedPence)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-sm text-navy/60">
                  Yours to keep (platform fee)
                </p>
                <p className="mt-2 font-heading text-3xl font-bold text-gold-dark">
                  {formatCurrency(reconciliation.totals.platformCutPence)}
                </p>
              </CardContent>
            </Card>
          </div>

          {(unmatchedCount > 0 ||
            reconciliation.totals.refundPence !== 0 ||
            reconciliation.otherLines.length > 0) && (
            <Card>
              <CardContent>
                <h3 className="font-heading text-base font-semibold text-navy">
                  Needs a look
                </h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {unmatchedCount > 0 && (
                    <li className="flex items-center justify-between rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                      <span>
                        {unmatchedCount} charge{unmatchedCount === 1 ? "" : "s"}{" "}
                        couldn&apos;t be matched to a token purchase &mdash; not
                        included in the split above
                      </span>
                      <span className="font-medium">
                        {formatCurrency(reconciliation.totals.unmatchedPence)}
                      </span>
                    </li>
                  )}
                  {reconciliation.totals.refundPence !== 0 && (
                    <li className="flex items-center justify-between rounded-md bg-red/10 px-3 py-2 text-red">
                      <span>Refunds included in this payout</span>
                      <span className="font-medium">
                        {formatCurrency(reconciliation.totals.refundPence)}
                      </span>
                    </li>
                  )}
                  {reconciliation.otherLines.map((l) => (
                    <li
                      key={l.balanceTransactionId}
                      className="flex items-center justify-between rounded-md bg-navy/5 px-3 py-2 text-navy/70"
                    >
                      <span>
                        {l.type}
                        {l.description ? ` — ${l.description}` : ""}
                      </span>
                      <span className="font-medium">{formatCurrency(l.amountPence)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="overflow-x-auto">
              <h3 className="mb-3 font-heading text-base font-semibold text-navy">
                Token purchases in this payout
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-left text-navy/50">
                    <th className="pb-2 font-medium">Level</th>
                    <th className="pb-2 text-right font-medium">Tokens</th>
                    <th className="pb-2 text-right font-medium">Net received</th>
                    <th className="pb-2 text-right font-medium">Tutor wages</th>
                    <th className="pb-2 text-right font-medium">Platform fee</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedLines.map((l) => (
                    <tr key={l.balanceTransactionId} className="border-b border-navy/5">
                      <td className="py-2.5 text-navy">{formatLevel(l.level!)}</td>
                      <td className="py-2.5 text-right text-navy">{l.quantity}</td>
                      <td className="py-2.5 text-right text-navy">
                        {formatCurrency(l.netPence)}
                      </td>
                      <td className="py-2.5 text-right text-navy">
                        {formatCurrency(l.tutorOwedPence!)}
                      </td>
                      <td className="py-2.5 text-right text-gold-dark">
                        {formatCurrency(l.platformCutPence!)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {matchedLines.length === 0 && (
                <p className="py-6 text-center text-sm text-navy/50">
                  No matched token purchases in this payout.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
