import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Feedback" };
export const dynamic = "force-dynamic";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-gold" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-navy/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminFeedbackPage() {
  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Client feedback
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Submitted from the public feedback form.
          </p>

          {feedback.length === 0 ? (
            <p className="mt-6 text-sm text-navy/50">No feedback submitted yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {feedback.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-navy/10 p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy">
                        {entry.clientName}{" "}
                        <span className="font-normal text-navy/50">
                          on {entry.tutorName}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-navy/40">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars rating={entry.rating} />
                      {entry.consentToShare ? (
                        <Badge variant="success">OK to share</Badge>
                      ) : (
                        <Badge variant="neutral">Private</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-navy/70">
                        Found helpful:
                      </span>{" "}
                      <span className="text-navy/80">{entry.helpfulText}</span>
                    </p>
                    {entry.improveText && (
                      <p>
                        <span className="font-medium text-navy/70">
                          Could improve:
                        </span>{" "}
                        <span className="text-navy/80">{entry.improveText}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
