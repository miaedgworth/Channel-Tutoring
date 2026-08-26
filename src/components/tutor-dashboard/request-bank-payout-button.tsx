"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestBankPayout } from "@/lib/actions/bank-payouts";
import { formatCurrencyGBP } from "@/lib/utils";

export function RequestBankPayoutButton({
  balancePence,
  hasPendingPayout,
}: {
  balancePence: number;
  hasPendingPayout: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestBankPayout();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red">{error}</p>}
      {hasPendingPayout ? (
        <p className="text-sm text-navy/60">
          Withdrawal requested — this will be paid on the next Monday payout run.
        </p>
      ) : (
        <Button
          variant="primary"
          onClick={handleClick}
          disabled={isPending || balancePence <= 0}
        >
          {isPending ? "Requesting..." : `Withdraw ${formatCurrencyGBP(balancePence)}`}
        </Button>
      )}
    </div>
  );
}
