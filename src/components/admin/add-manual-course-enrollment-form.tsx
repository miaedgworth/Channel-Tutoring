"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createManualCourseEnrollment } from "@/lib/actions/courses";
import { computeCoursePrice, splitDepositAndBalance } from "@/lib/course-pricing";
import { DEFAULT_COURSE_DEPOSIT_PERCENT } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { CourseDayTrack } from "@prisma/client";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

interface Day {
  id: string;
  label: string;
  track: CourseDayTrack;
  pricePence: number;
}

export function AddManualCourseEnrollmentForm({
  courseId,
  days,
  bundlePricePence,
  depositPercent,
}: {
  courseId: string;
  days: Day[];
  bundlePricePence: number | null;
  depositPercent: number | null;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dayIds, setDayIds] = useState<string[]>([]);
  const [childName, setChildName] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [depositStatus, setDepositStatus] = useState<"PENDING" | "PAID">("PAID");
  const [balanceStatus, setBalanceStatus] = useState<"PENDING" | "PAID">("PENDING");

  const effectiveDepositPercent = depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;
  const { totalPence } = useMemo(
    () => computeCoursePrice({ bundlePricePence, days }, dayIds),
    [bundlePricePence, days, dayIds],
  );
  const { depositPence, balancePence } = useMemo(
    () => splitDepositAndBalance(totalPence, effectiveDepositPercent),
    [totalPence, effectiveDepositPercent],
  );

  function toggleDay(dayId: string) {
    setDayIds((prev) => (prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId]));
  }

  function reset() {
    setDayIds([]);
    setChildName("");
    setGuardianName("");
    setGuardianEmail("");
    setGuardianPhone("");
    setNotes("");
    setDepositStatus("PAID");
    setBalanceStatus("PENDING");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const result = await createManualCourseEnrollment(courseId, {
      dayIds,
      childName,
      guardianName,
      guardianEmail: guardianEmail || undefined,
      guardianPhone: guardianPhone || undefined,
      notes: notes || undefined,
      depositStatus,
      balanceStatus,
    });
    setIsPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    reset();
    setAdding(false);
    router.refresh();
  }

  if (!adding) {
    return (
      <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
        Add a booking manually
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-navy/10 p-4">
      <p className="text-sm font-semibold text-navy">Add a booking made outside the website</p>
      <p className="mt-1 text-xs text-navy/50">
        For a place booked by phone, in person, or paid by bank transfer — not through the online
        checkout.
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        {days.map((day) => (
          <label
            key={day.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-navy/10 px-3 py-2 text-sm"
          >
            <span className="flex items-center gap-3">
              <input type="checkbox" checked={dayIds.includes(day.id)} onChange={() => toggleDay(day.id)} />
              <span className="font-medium text-navy">{day.label}</span>
            </span>
            <span className="text-navy/70">{formatCurrency(day.pricePence)}</span>
          </label>
        ))}
      </div>

      {dayIds.length > 0 && (
        <div className="mt-3 rounded-lg bg-navy/[0.03] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-navy/70">Total</span>
            <span className="font-semibold text-navy">{formatCurrency(totalPence)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-navy/70">Deposit ({effectiveDepositPercent}%)</span>
            <span className="font-semibold text-navy">{formatCurrency(depositPence)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-navy/70">Balance</span>
            <span className="text-navy">{formatCurrency(balancePence)}</span>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="manualChildName" className="block text-sm font-medium text-navy">
            Child&apos;s full name
          </label>
          <input
            id="manualChildName"
            required
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="manualGuardianName" className="block text-sm font-medium text-navy">
            Parent/guardian name
          </label>
          <input
            id="manualGuardianName"
            required
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="manualGuardianEmail" className="block text-sm font-medium text-navy">
            Parent/guardian email <span className="font-normal text-navy/40">(optional)</span>
          </label>
          <input
            id="manualGuardianEmail"
            type="email"
            value={guardianEmail}
            onChange={(e) => setGuardianEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="manualGuardianPhone" className="block text-sm font-medium text-navy">
            Parent/guardian phone <span className="font-normal text-navy/40">(optional)</span>
          </label>
          <input
            id="manualGuardianPhone"
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="manualDepositStatus" className="block text-sm font-medium text-navy">
            Deposit
          </label>
          <select
            id="manualDepositStatus"
            value={depositStatus}
            onChange={(e) => setDepositStatus(e.target.value as "PENDING" | "PAID")}
            className={inputClass}
          >
            <option value="PAID">Paid</option>
            <option value="PENDING">Not paid yet</option>
          </select>
        </div>
        <div>
          <label htmlFor="manualBalanceStatus" className="block text-sm font-medium text-navy">
            Balance
          </label>
          <select
            id="manualBalanceStatus"
            value={balanceStatus}
            onChange={(e) => setBalanceStatus(e.target.value as "PENDING" | "PAID")}
            className={inputClass}
          >
            <option value="PAID">Paid</option>
            <option value="PENDING">Not paid yet</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label htmlFor="manualNotes" className="block text-sm font-medium text-navy">
          Notes <span className="font-normal text-navy/40">(optional)</span>
        </label>
        <textarea
          id="manualNotes"
          rows={2}
          placeholder="e.g. medical notes, how it was paid, anything from the phone call"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="mt-4 flex gap-3">
        <Button type="submit" size="sm" disabled={isPending || dayIds.length === 0}>
          {isPending ? "Adding..." : "Add booking"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            reset();
            setError(null);
            setAdding(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
