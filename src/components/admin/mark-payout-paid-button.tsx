"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { markPayoutPaid } from "@/lib/actions/bank-payouts";

export function MarkPayoutPaidButton({ payoutId }: { payoutId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm("Confirm you've sent this bank transfer?")) return;
    startTransition(async () => {
      const result = await markPayoutPaid(payoutId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Button variant="primary" size="sm" disabled={isPending} onClick={handleClick}>
      {isPending ? "..." : "Mark as paid"}
    </Button>
  );
}
