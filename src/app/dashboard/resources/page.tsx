import type { Metadata } from "next";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Resources" };
export const dynamic = "force-dynamic";

export default async function ClientResourcesPage() {
  await requireUser("CLIENT");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-heading text-lg font-semibold text-navy">Tripos</h2>
            <Badge variant="gold">20% off with CHANNEL20</Badge>
          </div>
          <p className="mt-2 text-sm text-navy/70">
            Tripos is a free-to-try practice platform for A-Level students
            and anyone applying to Oxford or Cambridge, including entrance
            exam prep. It offers practice questions built on real past
            papers, mark schemes and examiner reports across a range of
            subjects.
          </p>
          <p className="mt-3 text-sm text-navy/70">
            Channel Tutoring students get{" "}
            <span className="font-semibold text-navy">20% off</span> with
            the code{" "}
            <span className="rounded bg-navy/5 px-1.5 py-0.5 font-mono text-xs font-semibold text-navy">
              CHANNEL20
            </span>
            .
          </p>
          <a
            href="https://www.tripos.org.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-md bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy/90"
          >
            Visit Tripos
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
