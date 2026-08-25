"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestPayout } from "@/lib/actions/stripe-connect";
import { formatCurrencyGBP } from "@/lib/utils";

export function RequestPayoutButton({ balancePence }: { balancePence: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestPayout();
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
      <Button
        variant="primary"
        onClick={handleClick}
        disabled={isPending || balancePence <= 0}
      >
        {isPending ? "Processing..." : `Withdraw ${formatCurrencyGBP(balancePence)}`}
      </Button>
    </div>
  );
}
