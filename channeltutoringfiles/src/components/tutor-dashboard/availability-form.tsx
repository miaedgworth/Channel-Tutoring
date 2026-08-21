"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createAvailabilitySlot } from "@/lib/actions/availability";

export function AvailabilityForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date || !time) {
      setError("Choose a date and time.");
      return;
    }
    const startsAt = new Date(`${date}T${time}`);
    startTransition(async () => {
      try {
        await createAvailabilitySlot({
          startsAt: startsAt.toISOString(),
          durationMinutes: Number(duration),
        });
        setDate("");
        setTime("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
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
        <label htmlFor="time" className="block text-xs font-medium text-navy/70">
          Start time
        </label>
        <input
          id="time"
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="mt-1 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="duration" className="block text-xs font-medium text-navy/70">
          Duration
        </label>
        <select
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="mt-1 rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-gold-dark focus:outline-none"
        >
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">60 minutes</option>
          <option value="90">90 minutes</option>
          <option value="120">120 minutes</option>
        </select>
      </div>
      <Button type="submit" variant="primary" size="sm" disabled={isPending}>
        {isPending ? "Adding..." : "Add Slot"}
      </Button>
    </form>
  );
}
