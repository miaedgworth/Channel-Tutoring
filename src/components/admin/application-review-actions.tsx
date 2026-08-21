"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  approveTutorApplication,
  rejectTutorApplication,
} from "@/lib/actions/tutor-applications";

export function ApplicationReviewActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      try {
        await approveTutorApplication(applicationId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      try {
        await rejectTutorApplication(applicationId, reason);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      {!showReject ? (
        <div className="flex gap-3">
          <Button onClick={handleApprove} disabled={isPending} variant="primary">
            {isPending ? "Approving..." : "Approve Application"}
          </Button>
          <Button
            onClick={() => setShowReject(true)}
            disabled={isPending}
            variant="danger"
          >
            Reject
          </Button>
        </div>
      ) : (
        <div className="space-y-3 rounded-md border border-red/20 bg-red/5 p-4">
          <label htmlFor="reason" className="block text-sm font-medium text-navy">
            Reason (optional — included in the applicant&apos;s email)
          </label>
          <textarea
            id="reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="block w-full rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
          />
          <div className="flex gap-3">
            <Button onClick={handleReject} disabled={isPending} variant="danger">
              {isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
            <Button
              onClick={() => setShowReject(false)}
              disabled={isPending}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
