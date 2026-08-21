"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markBookingCompleted } from "@/lib/actions/bookings";

export function MarkCompletedButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await markBookingCompleted(bookingId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red">{error}</p>}
      <Button variant="primary" size="sm" disabled={isPending} onClick={handleClick}>
        {isPending ? "Marking..." : "Mark as Completed"}
      </Button>
    </div>
  );
}
