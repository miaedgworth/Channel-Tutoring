"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { confirmBookingWithCredit } from "@/lib/actions/bookings";

export function ConfirmBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await confirmBookingWithCredit(bookingId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <div role="alert" className="text-sm text-red">
          <p>{error}</p>
          <Link href="/dashboard/credit" className="underline">
            Top up your balance
          </Link>
        </div>
      )}
      <Button variant="gold" size="sm" disabled={isPending} onClick={handleConfirm}>
        {isPending ? "Confirming..." : "Confirm & Use Credit"}
      </Button>
    </div>
  );
}
