import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { TutorDbsSelect } from "@/components/admin/tutor-dbs-select";
import { formatCurrencyGBP } from "@/lib/utils";
import { DBS_STATUS_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "Tutors" };
export const dynamic = "force-dynamic";

export default async function AdminTutorsPage() {
  const tutors = await prisma.tutorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Rate</th>
              <th className="pb-2 font-medium">Published</th>
              <th className="pb-2 font-medium">DBS</th>
              <th className="pb-2 font-medium">Account</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((tutor) => (
              <tr key={tutor.id} className="border-b border-navy/5">
                <td className="py-2.5">
                  <Link href={`/tutors/${tutor.slug}`} className="font-medium text-navy hover:underline">
                    {tutor.user.name}
                  </Link>
                  <p className="text-xs text-navy/40">{tutor.user.email}</p>
                </td>
                <td className="py-2.5 text-navy/70">{formatCurrencyGBP(tutor.hourlyRatePence)}/hr</td>
                <td className="py-2.5">
                  <Badge variant={tutor.isPublished ? "success" : "neutral"}>
                    {tutor.isPublished ? "Live" : "Unpublished"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <TutorDbsSelect tutorProfileId={tutor.id} dbsStatus={tutor.dbsStatus} />
                  <p className="mt-0.5 text-[10px] text-navy/40">
                    {DBS_STATUS_LABELS[tutor.dbsStatus]}
                  </p>
                </td>
                <td className="py-2.5">
                  <Badge variant={tutor.user.status === "ACTIVE" ? "success" : "danger"}>
                    {tutor.user.status}
                  </Badge>
                </td>
                <td className="py-2.5 text-right">
                  <UserStatusToggle userId={tutor.user.id} status={tutor.user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tutors.length === 0 && (
          <p className="py-6 text-center text-sm text-navy/50">No tutors yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
