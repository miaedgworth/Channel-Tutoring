import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { UserStatusToggle } from "@/components/admin/user-status-toggle";
import { PublishTutorToggle } from "@/components/admin/publish-tutor-toggle";
import { ResendSetupEmailButton } from "@/components/admin/resend-setup-email-button";
import { formatLevel } from "@/lib/utils";

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
        <div className="mb-4 flex justify-end">
          <LinkButton href="/admin/tutors/new" variant="primary" size="sm">
            Add Tutor
          </LinkButton>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Levels</th>
              <th className="pb-2 font-medium">Published</th>
              <th className="pb-2 font-medium">Account</th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((tutor) => (
              <tr key={tutor.id} className="border-b border-navy/5">
                <td className="py-2.5">
                  {tutor.isPublished ? (
                    <Link href={`/tutors/${tutor.slug}`} className="font-medium text-navy hover:underline">
                      {tutor.user.name}
                    </Link>
                  ) : (
                    <span className="font-medium text-navy">{tutor.user.name}</span>
                  )}
                  <p className="text-xs text-navy/40">{tutor.user.email}</p>
                </td>
                <td className="py-2.5 text-navy/70">{tutor.levels.map(formatLevel).join(", ")}</td>
                <td className="py-2.5">
                  <Badge variant={tutor.isPublished ? "success" : "neutral"}>
                    {tutor.isPublished ? "Live" : "Unpublished"}
                  </Badge>
                </td>
                <td className="py-2.5">
                  <Badge variant={tutor.user.status === "ACTIVE" ? "success" : "danger"}>
                    {tutor.user.status}
                  </Badge>
                </td>
                <td className="py-2.5 text-right">
                  <Link
                    href={`/admin/tutors/${tutor.id}/edit`}
                    className="text-sm font-medium text-navy underline"
                  >
                    Edit
                  </Link>
                </td>
                <td className="py-2.5 text-right">
                  <PublishTutorToggle tutorProfileId={tutor.id} isPublished={tutor.isPublished} />
                </td>
                <td className="py-2.5 text-right">
                  <ResendSetupEmailButton userId={tutor.user.id} />
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
