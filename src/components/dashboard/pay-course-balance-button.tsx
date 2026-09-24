"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestCourseBalancePayment } from "@/lib/actions/course-enrollment";
import { formatCurrency } from "@/lib/utils";

export function PayCourseBalanceButton({
  enrollmentId,
  balancePence,
}: {
  enrollmentId: string;
  balancePence: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await requestCourseBalancePayment(enrollmentId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red">{error}</p>}
      <Button size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? "Redirecting..." : `Pay balance of ${formatCurrency(balancePence)}`}
      </Button>
    </div>
  );
}
