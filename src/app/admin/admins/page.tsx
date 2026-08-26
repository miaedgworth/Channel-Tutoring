import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AddAdminForm } from "@/components/admin/add-admin-form";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Admins" };
export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, createdAt: true },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="overflow-x-auto">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Admins ({admins.length})
          </h2>
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-navy/10 text-navy/50">
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Email</th>
                <th className="pb-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-b border-navy/5">
                  <td className="py-2 pr-4 font-medium text-navy">{a.name}</td>
                  <td className="py-2 pr-4 text-navy/70">{a.email}</td>
                  <td className="py-2 text-navy/50">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Add Admin</h2>
          <p className="mt-1 text-sm text-navy/60">
            Admins have full access to the platform — bookings, payouts,
            tutors, clients and settings. Only add people you trust with
            that.
          </p>
          <div className="mt-6">
            <AddAdminForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
