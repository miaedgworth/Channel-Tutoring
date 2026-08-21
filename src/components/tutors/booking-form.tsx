"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatCurrencyGBP } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function BookingForm({
  tutorSlug,
  tutorSubjects,
  tutorLevels,
  tutorExamBoards,
  hourlyRatePence,
  slots,
}: {
  tutorSlug: string;
  tutorSubjects: string[];
  tutorLevels: string[];
  tutorExamBoards: string[];
  hourlyRatePence: number;
  slots: { id: string; startsAt: string; endsAt: string }[];
}) {
  const router = useRouter();
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [subject, setSubject] = useState(tutorSubjects[0] ?? "");
  const [level, setLevel] = useState(tutorLevels[0] ?? "GCSE");
  const [examBoard, setExamBoard] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedSlot = slots.find((s) => s.id === slotId);
  const durationMinutes = selectedSlot
    ? Math.round(
        (new Date(selectedSlot.endsAt).getTime() - new Date(selectedSlot.startsAt).getTime()) /
          60000,
      )
    : 0;
  const price = Math.round((hourlyRatePence * durationMinutes) / 60);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!slotId) {
      setError("Please choose a time slot.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, subject, level, examBoard, notes }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      router.push("/dashboard/bookings");
    }
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-8 text-center">
        <p className="text-navy/60">
          This tutor doesn&apos;t have any upcoming availability right now.
          Check back soon or message them to ask about future slots.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="slot" className="block text-sm font-medium text-navy">
          Choose a time
        </label>
        <select
          id="slot"
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          className={inputClass}
        >
          {slots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {formatDateTime(slot.startsAt)} (
              {Math.round(
                (new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000,
              )}{" "}
              min)
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-navy">
            Subject
          </label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {tutorSubjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-navy">
            Level
          </label>
          <select
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className={inputClass}
          >
            {tutorLevels.map((l) => (
              <option key={l} value={l}>
                {l === "A_LEVEL" ? "A-Level" : l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {tutorExamBoards.length > 0 && (
        <div>
          <label htmlFor="examBoard" className="block text-sm font-medium text-navy">
            Exam board (optional)
          </label>
          <select
            id="examBoard"
            value={examBoard}
            onChange={(e) => setExamBoard(e.target.value)}
            className={inputClass}
          >
            <option value="">Not sure / doesn&apos;t matter</option>
            {tutorExamBoards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-navy">
          Anything your tutor should know? (optional)
        </label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
          placeholder="e.g. topics to focus on, upcoming exam dates"
        />
      </div>

      <div className="rounded-md border border-navy/10 bg-navy/[0.02] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-navy/60">Session price</span>
          <span className="font-semibold text-navy">{formatCurrencyGBP(price)}</span>
        </div>
        <p className="mt-1 text-xs text-navy/40">
          Free cancellation up to 24 hours before your session. See our{" "}
          <a href="/legal/cancellation-refund-policy" className="underline">
            Cancellation Policy
          </a>
          .
        </p>
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Redirecting to payment..." : `Pay ${formatCurrencyGBP(price)} & Confirm`}
      </Button>
      <p className="text-center text-xs text-navy/40">
        You&apos;ll need to{" "}
        <a href={`/login?callbackUrl=/tutors/${tutorSlug}/book`} className="underline">
          log in
        </a>{" "}
        as a client to complete booking.
      </p>
    </form>
  );
}
