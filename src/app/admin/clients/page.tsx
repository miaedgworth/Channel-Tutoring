import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { GrantTokensControl } from "@/components/admin/grant-tokens-control";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Clients" };
export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await prisma.user.findMany({
    where: { role: "CLIENT" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookingsAsClient: true } } },
  });

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Joined</th>
              <th className="pb-2 font-medium">Bookings</th>
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
