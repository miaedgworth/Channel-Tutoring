import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayPalEmailForm } from "@/components/tutor-dashboard/paypal-email-form";
import { RequestPayPalPayoutButton } from "@/components/tutor-dashboard/request-paypal-payout-button";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";
import { isPayPalConfigured } from "@/lib/paypal";

export const metadata: Metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const user = await requireUser("TUTOR");

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">Tutor profile not found.</p>
        </CardContent>
      </Card>
    );
  }

  const ledgerEntries = await prisma.tutorLedgerEntry.findMany({
    where: { tutorId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      {!isPayPalConfigured() && (
        <div className="rounded-md border border-navy/10 bg-navy/[0.02] px-4 py-3 text-sm text-navy/60">
          Payments aren&apos;t configured in this environment yet.
        </div>
      )}

      {!profile.paypalEmail ? (
        <Card>
          <CardContent>
            <h2 className="font-heading text-lg font-semibold text-navy">
              Add your PayPal email
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              To receive payouts from bookings, tell us the email address
              on your PayPal account. Don&apos;t have one? You can create a
              free personal PayPal account in a couple of minutes.
            </p>
            <div className="mt-4">
              <PayPalEmailForm currentEmail={profile.paypalEmail} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent>
              <p className="text-sm text-navy/60">Available balance</p>
              <p className="mt-2 font-heading text-3xl font-bold text-navy">
                {formatCurrencyGBP(profile.balancePence)}
              </p>
              <div className="mt-4">
                <RequestPayPalPayoutButton balancePence={profile.balancePence} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm text-navy/60">Total earned to date</p>
              <p className="mt-2 font-heading text-3xl font-bold text-navy">
                {formatCurrencyGBP(profile.totalEarnedPence)}
              </p>
              <Badge variant="success" className="mt-3">
                PayPal connected
              </Badge>
              <div className="mt-4">
                <p className="text-xs text-navy/40">
                  Paying out to {profile.paypalEmail}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-navy/50 underline">
                    Change PayPal email
                  </summary>
                  <div className="mt-3">
                    <PayPalEmailForm currentEmail={profile.paypalEmail} />
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Ledger</h2>
          {ledgerEntries.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">No transactions yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-left text-navy/50">
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-navy/5">
                      <td className="py-2 text-navy/60">{formatDateTime(entry.createdAt)}</td>
                      <td className="py-2 text-navy/60">{entry.type}</td>
                      <td className="py-2 text-navy">{entry.description}</td>
                      <td
                        className={`py-2 text-right font-medium ${
                          entry.amountPence < 0 ? "text-red" : "text-emerald-700"
                        }`}
                      >
                        {entry.amountPence < 0 ? "-" : "+"}
                        {formatCurrencyGBP(Math.abs(entry.amountPence))}
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
