"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AVAILABILITY_PERIODS } from "@/lib/constants";
import { createAvailabilitySlot } from "@/lib/actions/availability";

export function AvailabilityForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [period, setPeriod] = useState("MORNING");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("Choose a date.");
      return;
    }
    startTransition(async () => {
      const result = await createAvailabilitySlot({ date, period });
      if (result.error) {
        setError(result.error);
        return;
      }
      setDate("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      {error && (
        <p role="alert" className="w-full rounded-md bg-red/10 px-4 py-2 text-sm text-red">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="date" className="block text-xs font-medium text-navy/70">
          Date
        </label>
        <input
          id="date"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="period" className="block text-xs font-medium text-navy/70">
          Period
        </label>
        <select
          id="period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="mt-1 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        >
          {AVAILABILITY_PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Add Availability"}
      </Button>
    </form>
  );
}
