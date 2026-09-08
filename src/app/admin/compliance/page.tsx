import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PromptAgreementResignButton } from "@/components/admin/prompt-agreement-resign-button";

export const metadata: Metadata = { title: "Compliance" };
export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AdminCompliancePage() {
  const tutors = await prisma.tutorProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });

  return (
    <Card>
      <CardContent className="overflow-x-auto">
        <p className="mb-4 text-sm text-navy/60">
          Use &ldquo;Prompt to sign&rdquo; to require a specific tutor to
          (re-)sign the Tutor Agreement next time they open their dashboard.
          This is never done automatically for existing tutors — some have
          already signed it a different way.
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/10 text-left text-navy/50">
              <th className="pb-2 font-medium">Tutor</th>
              <th className="pb-2 font-medium">Agreement</th>
              <th className="pb-2 font-medium"></th>
              <th className="pb-2 font-medium">DBS check</th>
            </tr>
          </thead>
          <tbody>
            {tutors.map((tutor) => {
              const needsToSign =
                !!tutor.agreementRequestedAt &&
                (!tutor.agreementSignedAt || tutor.agreementRequestedAt > tutor.agreementSignedAt);
              return (
                <tr key={tutor.id} className="border-b border-navy/5 align-top">
                  <td className="py-3">
                    <p className="font-medium text-navy">{tutor.user.name}</p>
                    <p className="text-xs text-navy/40">{tutor.user.email}</p>
                  </td>
                  <td className="py-3">
                    {tutor.agreementSignedAt ? (
                      <>
                        <Badge variant={needsToSign ? "warning" : "success"}>
                          {needsToSign ? "Awaiting re-sign" : "Signed"}
                        </Badge>
                        <p className="mt-1 text-xs text-navy/60">
                          {tutor.agreementSignedName} &middot; {formatDate(tutor.agreementSignedAt)}
                          {tutor.agreementVersion ? ` (v: ${tutor.agreementVersion})` : null}
                        </p>
                        {needsToSign && (
                          <p className="mt-0.5 text-xs text-amber-700">
                            Re-sign requested {formatDate(tutor.agreementRequestedAt!)}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <Badge variant={tutor.agreementRequestedAt ? "warning" : "neutral"}>
                          {tutor.agreementRequestedAt ? "Requested, not signed" : "Not signed"}
                        </Badge>
                        {tutor.agreementRequestedAt && (
                          <p className="mt-1 text-xs text-navy/60">
                            Requested {formatDate(tutor.agreementRequestedAt)}
                          </p>
                        )}
                      </>
                    )}
                  </td>
                  <td className="py-3">
                    <PromptAgreementResignButton tutorProfileId={tutor.id} />
                  </td>
                  <td className="py-3">
                    {tutor.dbsCheckUrl ? (
                      <>
                        <p className="text-navy/80">{tutor.dbsCheckFileName}</p>
                        {tutor.dbsCheckUploadedAt && (
                          <p className="text-xs text-navy/40">{formatDate(tutor.dbsCheckUploadedAt)}</p>
                        )}
                        <a
                          href={`/api/tutor-dashboard/dbs/${tutor.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-navy underline"
                        >
                          View
                        </a>
                      </>
                    ) : (
                      <Badge variant="neutral">Not uploaded</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tutors.length === 0 && (
          <p className="py-6 text-center text-sm text-navy/50">No tutors yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
