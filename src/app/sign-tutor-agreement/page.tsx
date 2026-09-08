import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LegalPage } from "@/components/legal/legal-page";
import { TutorAgreementContent } from "@/components/legal/tutor-agreement-content";
import { SignTutorAgreementForm } from "@/components/tutor-dashboard/sign-tutor-agreement-form";
import { TUTOR_AGREEMENT_VERSION } from "@/lib/constants";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Sign Tutor Agreement" };
export const dynamic = "force-dynamic";

export default async function SignTutorAgreementPage() {
  const user = await requireUser("TUTOR");

  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.id },
    select: { agreementRequestedAt: true, agreementSignedAt: true },
  });
  const needsToSign =
    !!profile?.agreementRequestedAt &&
    (!profile.agreementSignedAt || profile.agreementRequestedAt > profile.agreementSignedAt);
  if (!needsToSign) {
    redirect("/tutor-dashboard");
  }

  return (
    <LegalPage title="Tutor Agreement" lastUpdated={TUTOR_AGREEMENT_VERSION}>
      <div className="not-prose mb-6 rounded-lg border border-navy/15 bg-navy/[0.03] px-4 py-3 text-sm text-navy/80">
        Please read and sign this agreement to continue to your tutor
        dashboard.
      </div>
      <TutorAgreementContent />
      <SignTutorAgreementForm />
    </LegalPage>
  );
}
