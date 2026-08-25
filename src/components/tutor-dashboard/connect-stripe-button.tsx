"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createConnectOnboardingLink } from "@/lib/actions/stripe-connect";

export function ConnectStripeButton({ label }: { label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createConnectOnboardingLink();
      if (!("url" in result) || !result.url) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <div>
      {error && <p className="mb-2 text-sm text-red">{error}</p>}
      <Button variant="gold" onClick={handleClick} disabled={isPending}>
        {isPending ? "Redirecting..." : label}
      </Button>
    </div>
  );
}
