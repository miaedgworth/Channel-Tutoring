import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { TutorApplicationStatus } from "@prisma/client";

export const metadata: Metadata = { title: "Tutor Applications" };
export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<TutorApplicationStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export default async function TutorApplicationsPage({
  searchParams,
}: PageProps<"/admin/tutor-applications">) {
  const { status } = await searchParams;
  const statusFilter =
    typeof status === "string" && ["PENDING", "APPROVED", "REJECTED"].includes(status)
      ? (status as TutorApplicationStatus)
      : "PENDING";

  const applications = await prisma.tutorApplication.findMany({
    where: { status: statusFilter },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/tutor-applications?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusFilter === s
                ? "bg-navy text-white"
                : "bg-navy/5 text-navy/70 hover:bg-navy/10"
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <Card className="mt-6">
          <CardContent>
            <p className="text-sm text-navy/60">
              No {statusFilter.toLowerCase()} applications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {applications.map((app) => (
            <Link key={app.id} href={`/admin/tutor-applications/${app.id}`}>
              <Card className="transition-colors hover:border-navy/30">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-navy">{app.name}</p>
                      <Badge variant={STATUS_VARIANT[app.status]}>
                        {app.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-navy/60">
                      {app.subjects.join(", ")} &middot; {app.email}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-navy/50">
                    Applied {formatDate(app.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
