"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markSessionComplete } from "@/lib/actions/bookings";

export function MarkSessionCompleteButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await markSessionComplete(bookingId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p role="alert" className="text-sm text-red">
          {error}
        </p>
      )}
      <Button variant="primary" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Marking complete..." : "Mark as Complete"}
      </Button>
    </div>
  );
}
