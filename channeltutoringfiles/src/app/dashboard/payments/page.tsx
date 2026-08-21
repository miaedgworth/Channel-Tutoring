import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrencyGBP, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Payments & Receipts" };
export const dynamic = "force-dynamic";

export default async function ClientPaymentsPage() {
  const user = await requireUser("CLIENT");

  const payments = await prisma.payment.findMany({
    where: { booking: { clientId: user.id } },
    orderBy: { createdAt: "desc" },
    include: { booking: { include: { tutor: { include: { user: { select: { name: true } } } } } } },
  });

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">No payments yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 font-medium">Session</th>
              <th className="pb-2 font-medium">Status</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-navy/5">
                <td className="py-2.5 text-navy/60">{formatDate(payment.createdAt)}</td>
                <td className="py-2.5 text-navy">
                  {payment.booking.subject} with {payment.booking.tutor.user.name}
                </td>
                <td className="py-2.5">
                  <Badge
                    variant={
                      payment.status === "SUCCEEDED"
                        ? "success"
                        : payment.status === "REFUNDED"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {payment.status}
                  </Badge>
                </td>
                <td className="py-2.5 text-right font-medium text-navy">
                  {formatCurrencyGBP(payment.amountPence)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
