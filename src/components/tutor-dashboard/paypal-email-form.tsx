"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { setPayPalEmail } from "@/lib/actions/paypal-payouts";

export function PayPalEmailForm({ currentEmail }: { currentEmail: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await setPayPalEmail(email);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red">{error}</p>}
      {saved && <p className="text-sm text-emerald-700">PayPal email saved.</p>}
      <div>
        <label htmlFor="paypalEmail" className="block text-sm font-medium text-navy">
          PayPal email address
        </label>
        <input
          id="paypalEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
        <p className="mt-1.5 text-xs text-navy/50">
          Don&apos;t have a PayPal account?{" "}
          <a
            href="https://www.paypal.com/gb/webapps/mpp/account-selection"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Create a free one
          </a>{" "}
          — it only takes a couple of minutes.
        </p>
      </div>
      <Button type="submit" variant="gold" disabled={isPending}>
        {isPending ? "Saving..." : currentEmail ? "Update PayPal email" : "Save PayPal email"}
      </Button>
    </form>
  );
}
