import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { TokenPurchaseForm } from "@/components/dashboard/token-purchase-form";
import { formatDateTime, formatLevel, formatTokenQuantity } from "@/lib/utils";
import { LEVELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Lesson Tokens" };
export const dynamic = "force-dynamic";

export default async function TokensPage({
  searchParams,
}: PageProps<"/dashboard/tokens">) {
  const user = await requireUser("CLIENT");
  const search = await searchParams;

  const [balances, transactions] = await Promise.all([
    prisma.tokenBalance.findMany({ where: { userId: user.id } }),
    prisma.tokenTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  const balanceByLevel = new Map<string, string>(
    balances.map((b) => [b.level, formatTokenQuantity(b.balance)]),
  );

  return (
    <div className="space-y-6">
      {search.checkout === "success" && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your tokens are being added — this will update shortly.
        </div>
      )}

      <Card>
        <CardContent>
          <p className="text-sm text-navy/50">Your tokens</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {LEVELS.map((l) => (
              <div
                key={l.value}
                className="rounded-lg border border-navy/10 bg-navy/[0.02] px-4 py-3"
              >
                <p className="text-xs text-navy/50">{l.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold text-navy">
                  {balanceByLevel.get(l.value) ?? "0"}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-navy/60">
            Buy tokens, then message a tutor to arrange a lesson at that
            level — they&apos;ll log it once it&apos;s taught and the right
            number of tokens is used automatically. 1 token = a 1-hour
            session; longer or shorter sessions use tokens proportionally
            (e.g. a 1.5-hour session uses 1.5 tokens). See{" "}
            <a href="/pricing" className="underline">
              Pricing
            </a>{" "}
            for full details.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Buy Tokens</h2>
          <div className="mt-4">
            <TokenPurchaseForm />
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
                    <p className="text-xs text-navy/40">
                      {formatLevel(tx.level)} &middot; {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`font-medium ${Number(tx.quantity) >= 0 ? "text-emerald-700" : "text-navy"}`}
                  >
                    {Number(tx.quantity) >= 0 ? "+" : ""}
                    {formatTokenQuantity(tx.quantity)}
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
