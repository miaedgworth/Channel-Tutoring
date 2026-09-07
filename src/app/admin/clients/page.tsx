import type { Metadata } from "next";
import type { Level } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { GrantTokensControl } from "@/components/admin/grant-tokens-control";
import { formatDate, formatTokenQuantity, formatLevel } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

type LevelBreakdown = { level: Level; purchased: number; remaining: number }[];

export default async function AdminClientsPage() {
  const [clients, balances, purchases] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { bookingsAsClient: true } } },
    }),
    prisma.tokenBalance.groupBy({ by: ["userId", "level"], _sum: { balance: true } }),
    prisma.tokenTransaction.groupBy({
      by: ["userId", "level"],
      where: { type: { in: ["PURCHASE", "ADMIN_GRANT"] } },
      _sum: { quantity: true },
    }),
  ]);

  // Per-client, per-level breakdown — a client can hold tokens at more than
  // one level (e.g. GCSE for one child, KS3 for another), which a single
  // combined total would hide.
  const breakdownByUser = new Map<string, Map<Level, { purchased: number; remaining: number }>>();
  const getLevelMap = (userId: string) => {
    let levelMap = breakdownByUser.get(userId);
    if (!levelMap) {
      levelMap = new Map();
      breakdownByUser.set(userId, levelMap);
    }
    return levelMap;
  };
  for (const p of purchases) {
    getLevelMap(p.userId).set(p.level, {
      purchased: Number(p._sum.quantity ?? 0),
      remaining: 0,
    });
  }
  for (const b of balances) {
    const entry = getLevelMap(b.userId).get(b.level);
    const remaining = Number(b._sum.balance ?? 0);
    if (entry) {
      entry.remaining = remaining;
    } else {
      getLevelMap(b.userId).set(b.level, { purchased: 0, remaining });
    }
  }
  const levelsByUser = new Map<string, LevelBreakdown>(
    Array.from(breakdownByUser.entries()).map(([userId, levelMap]) => [
      userId,
      Array.from(levelMap.entries())
        .map(([level, v]) => ({ level, ...v }))
        .sort((a, b) => a.level.localeCompare(b.level)),
    ]),
  );

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Joined</th>
              <th className="pb-2 font-medium">Bookings</th>
              <th className="pb-2 font-medium">Tokens (purchased &rarr; remaining)</th>
              <th className="pb-2 font-medium">Newsletter</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-navy/5">
                <td className="py-2.5">
                  <p className="font-medium text-navy">{client.name}</p>
                  <p className="text-xs text-navy/40">{client.email}</p>
                </td>
                <td className="py-2.5 text-navy/60">{formatDate(client.createdAt)}</td>
                <td className="py-2.5 text-navy/60">{client._count.bookingsAsClient}</td>
                <td className="py-2.5 text-navy/60">
                  {(() => {
                    const breakdown = levelsByUser.get(client.id) ?? [];
                    if (breakdown.length === 0) return <span>&mdash;</span>;
                    return (
                      <ul className="space-y-0.5">
                        {breakdown.map((b) => (
                          <li key={b.level}>
                            <span className="font-medium text-navy">{formatLevel(b.level)}:</span>{" "}
                            {formatTokenQuantity(b.purchased)} &rarr;{" "}
                            {formatTokenQuantity(b.remaining)} left
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </td>
                <td className="py-2.5">
                  <Badge variant={client.newsletterOptIn ? "gold" : "neutral"}>
                    {client.newsletterOptIn ? "Subscribed" : "Not subscribed"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <Badge variant={client.status === "ACTIVE" ? "success" : "danger"}>
                    {client.status}
                  </Badge>
                </td>
                <td className="py-2.5 text-right">
                  <GrantTokensControl clientUserId={client.id} />
                </td>
                <td className="py-2.5 text-right">
                  <UserStatusToggle userId={client.id} status={client.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clients.length === 0 && (
          <p className="py-6 text-center text-sm text-navy/50">No clients yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
