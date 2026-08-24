import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatLevel } from "@/lib/utils";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";

export const metadata: Metadata = { title: "Review Application" };
export const dynamic = "force-dynamic";

export default async function TutorApplicationDetailPage({
  params,
}: PageProps<"/admin/tutor-applications/[id]">) {
  const { id } = await params;
  const application = await prisma.tutorApplication.findUnique({
    where: { id },
  });
  if (!application) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-navy">
            {application.name}
          </h2>
          <p className="text-sm text-navy/60">
            Applied {formatDateTime(application.createdAt)}
          </p>
        </div>
        <Badge
          variant={
            application.status === "PENDING"
              ? "warning"
              : application.status === "APPROVED"
                ? "success"
                : "danger"
          }
        >
          {application.status}
        </Badge>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-navy/50">Email</dt>
              <dd className="font-medium text-navy">{application.email}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Phone</dt>
              <dd className="font-medium text-navy">{application.phone}</dd>
            </div>
            <div>
              <dt className="text-navy/50">Levels</dt>
              <dd className="font-medium text-navy">
                {application.levels.map(formatLevel).join(", ")}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-navy/50">Subjects</dt>
              <dd className="font-medium text-navy">
                {application.subjects.join(", ")}
              </dd>
            </div>
            {application.cvUrl && (
              <div>
                <dt className="text-navy/50">CV</dt>
                <dd>
                  <a
                    href={application.cvUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-navy underline"
                  >
                    View CV
                  </a>
                </dd>
              </div>
            )}
            {application.referenceUrl && (
              <div>
                <dt className="text-navy/50">Reference</dt>
                <dd>
                  <a
                    href={application.referenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-navy underline"
                  >
                    View reference
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div>
            <p className="text-navy/50 text-sm">Qualifications</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-navy">
              {application.qualifications}
            </p>
          </div>

          <div>
            <p className="text-navy/50 text-sm">Bio</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-navy">
              {application.bio}
            </p>
          </div>

          {application.availabilityNotes && (
            <div>
              <p className="text-navy/50 text-sm">Availability notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-navy">
                {application.availabilityNotes}
              </p>
            </div>
          )}

          {application.status === "REJECTED" && application.rejectionReason && (
            <div className="rounded-md bg-red/5 p-3">
              <p className="text-red text-sm">
                Rejection reason: {application.rejectionReason}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {application.status === "PENDING" && (
        <ApplicationReviewActions applicationId={application.id} />
      )}
    </div>
  );
}
