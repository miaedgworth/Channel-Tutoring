import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BankDetailsForm } from "@/components/tutor-dashboard/bank-details-form";
import { RequestBankPayoutButton } from "@/components/tutor-dashboard/request-bank-payout-button";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

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

  const [ledgerEntries, pendingPayout] = await Promise.all([
    prisma.tutorLedgerEntry.findMany({
      where: { tutorId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payout.findFirst({
      where: { tutorId: profile.id, status: "PENDING" },
    }),
  ]);

  const hasBankDetails = Boolean(
    profile.bankAccountName && profile.bankSortCode && profile.bankAccountNumber,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-navy/10 bg-navy/[0.02] px-4 py-3 text-sm text-navy/60">
        Withdrawals are paid out by bank transfer every Monday.
      </div>

      {!hasBankDetails ? (
        <Card>
          <CardContent>
            <h2 className="font-heading text-lg font-semibold text-navy">
              Add your bank details
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              To receive payouts from bookings, add the UK bank account
              you&apos;d like to be paid into.
            </p>
            <div className="mt-4">
              <BankDetailsForm
                current={{
                  bankAccountName: profile.bankAccountName,
                  bankSortCode: profile.bankSortCode,
                  bankAccountNumber: profile.bankAccountNumber,
                }}
              />
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
                <RequestBankPayoutButton
                  balancePence={profile.balancePence}
                  hasPendingPayout={Boolean(pendingPayout)}
                />
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
                Bank details added
              </Badge>
              <div className="mt-4">
                <p className="text-xs text-navy/40">
                  Paying out to account ending {profile.bankAccountNumber?.slice(-4)}
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-navy/50 underline">
                    Change bank details
                  </summary>
                  <div className="mt-3">
                    <BankDetailsForm
                      current={{
                        bankAccountName: profile.bankAccountName,
                        bankSortCode: profile.bankSortCode,
                        bankAccountNumber: profile.bankAccountNumber,
                      }}
                    />
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
