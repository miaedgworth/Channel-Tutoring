"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { requestGuestCourseBalancePayment } from "@/lib/actions/course-enrollment";

export function GuestBalancePaymentForm({ enrollmentId }: { enrollmentId: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await requestGuestCourseBalancePayment(enrollmentId, email);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="guestBalanceEmail" className="block text-sm font-medium text-navy">
          Email you used when booking
        </label>
        <input
          id="guestBalanceEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Continuing..." : "Continue to payment"}
      </Button>
    </form>
  );
}
