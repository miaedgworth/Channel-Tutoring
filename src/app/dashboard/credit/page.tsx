import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { TopUpForm } from "@/components/dashboard/top-up-form";
import { formatCurrencyGBP, formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Credit Balance" };
export const dynamic = "force-dynamic";

export default async function CreditPage({
  searchParams,
}: PageProps<"/dashboard/credit">) {
  const user = await requireUser("CLIENT");
  const search = await searchParams;

  const [me, transactions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    prisma.creditTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="space-y-6">
      {search.checkout === "success" && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your top-up is being processed — your balance will update shortly.
        </div>
      )}

      <Card>
        <CardContent>
          <p className="text-sm text-navy/50">Your balance</p>
          <p className="mt-1 font-heading text-3xl font-bold text-navy">
            {formatCurrencyGBP(me.creditBalancePence)}
          </p>
          <p className="mt-2 text-sm text-navy/60">
            Top up your balance, then confirm lessons your tutors schedule for
            you using this credit — no need to pay again each time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Top Up</h2>
          <div className="mt-4">
            <TopUpForm />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">History</h2>
          {transactions.length === 0 ? (
            <p className="mt-2 text-sm text-navy/50">No transactions yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-navy/10">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="text-navy">{tx.description}</p>
                    <p className="text-xs text-navy/40">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <span
                    className={`font-medium ${tx.amountPence >= 0 ? "text-emerald-700" : "text-navy"}`}
                  >
                    {tx.amountPence >= 0 ? "+" : ""}
                    {formatCurrencyGBP(tx.amountPence)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
