import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { TutorAgreementContent } from "@/components/legal/tutor-agreement-content";
import { TUTOR_AGREEMENT_VERSION } from "@/lib/constants";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Tutor Agreement" };
export const dynamic = "force-dynamic";

export default async function TutorAgreementPage() {
  const user = await requireUser("TUTOR");
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: { agreementSignedAt: true, agreementSignedName: true, agreementVersion: true },
  });

  return (
    <LegalPage title="Tutor Agreement" lastUpdated={TUTOR_AGREEMENT_VERSION}>
      {profile?.agreementSignedAt ? (
        <div className="not-prose mb-6 rounded-lg border border-green-600/20 bg-green-50 px-4 py-3 text-sm text-green-800">
          Signed by <strong>{profile.agreementSignedName}</strong> on{" "}
          {profile.agreementSignedAt.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          {profile.agreementVersion ? ` (version: ${profile.agreementVersion})` : null}.
        </div>
      ) : (
        <div className="not-prose mb-6 rounded-lg border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You haven&apos;t signed this agreement yet. If we&apos;ve asked you
          to sign it, you&apos;ll be prompted next time you open your tutor
          dashboard.
        </div>
      )}
      <TutorAgreementContent />
    </LegalPage>
  );
}
