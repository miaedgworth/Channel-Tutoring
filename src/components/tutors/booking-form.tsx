"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatCurrencyGBP, formatLevel } from "@/lib/utils";
import {
  EXAM_BOARDS,
  LEVEL_PRICE_PENCE,
  BLOCK_BOOKING_MIN_SESSIONS,
  BLOCK_BOOKING_DISCOUNT_RATE,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

function slotDurationMinutes(slot: { startsAt: string; endsAt: string }) {
  return Math.round((new Date(slot.endsAt).getTime() - new Date(slot.startsAt).getTime()) / 60000);
}

export function BookingForm({
  tutorSlug,
  tutorSubjects,
  tutorLevels,
  slots,
}: {
  tutorSlug: string;
  tutorSubjects: string[];
  tutorLevels: string[];
  slots: { id: string; startsAt: string; endsAt: string }[];
}) {
  const router = useRouter();
  const [slotIds, setSlotIds] = useState<string[]>(slots[0] ? [slots[0].id] : []);
  const [subject, setSubject] = useState(tutorSubjects[0] ?? "");
  const [level, setLevel] = useState(tutorLevels[0] ?? "GCSE");
  const [examBoard, setExamBoard] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedSlots = slots.filter((s) => slotIds.includes(s.id));
  const levelPricePerHour = LEVEL_PRICE_PENCE[level] ?? 0;
  const isBlockBooking = selectedSlots.length >= BLOCK_BOOKING_MIN_SESSIONS;

  const { subtotal, discount, total } = useMemo(() => {
    const sub = selectedSlots.reduce(
      (sum, slot) => sum + Math.round((levelPricePerHour * slotDurationMinutes(slot)) / 60),
      0,
    );
    const disc = isBlockBooking ? Math.round(sub * BLOCK_BOOKING_DISCOUNT_RATE) : 0;
    return { subtotal: sub, discount: disc, total: sub - disc };
  }, [selectedSlots, levelPricePerHour, isBlockBooking]);

  function toggleSlot(id: string) {
    setSlotIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (slotIds.length === 0) {
      setError("Please choose at least one time slot.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotIds, subject, level, examBoard, notes }),
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
        <label className="block text-sm font-medium text-navy">
          Choose one or more times
        </label>
        <p className="mt-1 text-xs text-navy/50">
          Select {BLOCK_BOOKING_MIN_SESSIONS} or more sessions for the same
          subject and level to get a {Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% block-booking
          discount.
        </p>
        <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto rounded-md border border-navy/10 p-2">
          {slots.map((slot) => (
            <label
              key={slot.id}
              className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-navy/[0.03]"
            >
              <input
                type="checkbox"
                checked={slotIds.includes(slot.id)}
                onChange={() => toggleSlot(slot.id)}
                className="h-4 w-4 shrink-0 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
              />
              <span>
                {formatDateTime(slot.startsAt)} ({slotDurationMinutes(slot)} min)
              </span>
            </label>
          ))}
        </div>
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
                {formatLevel(l)}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          {EXAM_BOARDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

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
          placeholder="e.g. topics to focus on, upcoming exam dates, or if this is for more than one student"
        />
      </div>

      <div className="rounded-md border border-navy/10 bg-navy/[0.02] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-navy/60">
            {selectedSlots.length} session{selectedSlots.length === 1 ? "" : "s"} &times;{" "}
            {formatCurrencyGBP(levelPricePerHour)}/hr
          </span>
          <span className="font-medium text-navy">{formatCurrencyGBP(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm text-emerald-700">
            <span>Block-booking discount ({Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}%)</span>
            <span>&minus;{formatCurrencyGBP(discount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-navy/10 pt-2 text-sm">
          <span className="font-semibold text-navy">Total</span>
          <span className="font-semibold text-navy">{formatCurrencyGBP(total)}</span>
        </div>
        <p className="mt-2 text-xs text-navy/40">
          Group lesson with more than one student? Add £7/hour per extra
          student &mdash; mention it in the notes above and we&apos;ll
          confirm the adjusted price with you. Cancellations within 24
          hours are charged at 50%. See our{" "}
          <a href="/legal/cancellation-refund-policy" className="underline">
            Cancellation Policy
          </a>
          .
        </p>
      </div>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Redirecting to payment..." : `Pay ${formatCurrencyGBP(total)} & Confirm`}
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
