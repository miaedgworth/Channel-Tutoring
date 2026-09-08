import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { DbsCheckUpload } from "@/components/tutor-dashboard/dbs-check-upload";
import { region } from "@/lib/region";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

export default async function TutorCompliancePage() {
  const user = await requireUser("TUTOR");
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      agreementSignedAt: true,
      agreementSignedName: true,
      agreementVersion: true,
      dbsCheckUrl: true,
      dbsCheckFileName: true,
      dbsCheckUploadedAt: true,
    },
  });

  if (!profile) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-navy/60">
            We couldn&apos;t find your tutor profile. Please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-bold text-navy">Tutor Agreement</h2>
          {profile.agreementSignedAt ? (
            <p className="mt-2 text-sm text-navy/70">
              Signed by <strong>{profile.agreementSignedName}</strong> on{" "}
              {profile.agreementSignedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {profile.agreementVersion ? ` (version: ${profile.agreementVersion})` : null}.
            </p>
          ) : (
            <p className="mt-2 text-sm text-navy/60">You haven&apos;t signed this yet.</p>
          )}
          <Link href="/legal/tutor-agreement" className="mt-2 inline-block text-sm font-medium text-navy underline">
            View the Tutor Agreement
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-bold text-navy">{region.criminalRecordCheckLabel}</h2>
          <p className="mt-1 text-sm text-navy/60">
            Upload a copy of your {region.criminalRecordCheckLabel}. Only you
            and {region.brandName} admin can view it.
          </p>
          <div className="mt-4">
            <DbsCheckUpload
              tutorProfileId={profile.id}
              fileName={profile.dbsCheckFileName}
              uploadedAt={profile.dbsCheckUploadedAt?.toISOString() ?? null}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
