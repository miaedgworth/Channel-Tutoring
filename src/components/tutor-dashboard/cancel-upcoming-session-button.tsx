"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelUpcomingSession } from "@/lib/actions/bookings";

export function CancelUpcomingSessionButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result = await cancelUpcomingSession(bookingId, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (!showConfirm) {
    return (
      <Button variant="danger" size="sm" onClick={() => setShowConfirm(true)}>
        Cancel This Session
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-red/20 bg-red/5 p-4">
      {error && (
        <p role="alert" className="text-sm text-red">
          {error}
        </p>
      )}
      <p className="text-sm text-navy">
        Are you sure you want to cancel this session? The client&apos;s
        tokens will be refunded in full.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Reason (optional)"
        className="block w-full rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
      />
      <div className="flex gap-3">
        <Button variant="danger" size="sm" disabled={isPending} onClick={handleCancel}>
          {isPending ? "Cancelling..." : "Confirm Cancellation"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowConfirm(false)}>
          Never mind
        </Button>
      </div>
    </div>
  );
}
