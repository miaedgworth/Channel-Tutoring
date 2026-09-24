"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CourseTermsContent } from "@/components/legal/course-terms-content";
import { createCourseEnrollment } from "@/lib/actions/course-enrollment";
import { computeCoursePrice, splitDepositAndBalance } from "@/lib/course-pricing";
import { COURSE_CHILD_QUESTIONS, DEFAULT_COURSE_DEPOSIT_PERCENT } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { CourseDayTrack } from "@prisma/client";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export interface EnrollmentDay {
  id: string;
  date: string;
  label: string;
  track: CourseDayTrack;
  pricePence: number;
}

export function CourseEnrollmentForm({
  courseSlug,
  days,
  bundlePricePence,
  bundleLabel,
  depositPercent,
  balanceDueDate,
  isLoggedInClient,
}: {
  courseSlug: string;
  days: EnrollmentDay[];
  bundlePricePence: number | null;
  bundleLabel: string | null;
  depositPercent: number | null;
  balanceDueDate: string | null;
  isLoggedInClient: boolean;
}) {
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [childName, setChildName] = useState("");
  const [childAnswers, setChildAnswers] = useState<Record<string, string>>({});
  const [termsSignedName, setTermsSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const effectiveDepositPercent = depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;

  const { totalPence, bundleApplied } = useMemo(
    () => computeCoursePrice({ bundlePricePence, days }, selectedDayIds),
    [bundlePricePence, days, selectedDayIds],
  );
  const selectedTracks = useMemo(
    () => new Set(days.filter((d) => selectedDayIds.includes(d.id)).map((d) => d.track)),
    [days, selectedDayIds],
  );
  const visibleQuestions = useMemo(
    () => COURSE_CHILD_QUESTIONS.filter((q) => !q.showIfTrack || selectedTracks.has(q.showIfTrack)),
    [selectedTracks],
  );
  const { depositPence, balancePence } = useMemo(
    () => splitDepositAndBalance(totalPence, effectiveDepositPercent),
    [totalPence, effectiveDepositPercent],
  );

  function toggleDay(dayId: string) {
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCourseEnrollment(courseSlug, {
        dayIds: selectedDayIds,
        childName,
        childAnswers,
        termsSignedName,
        agreedToTerms: agreed as true,
      });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      window.location.href = result.url;
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div>
        <h3 className="font-heading text-sm font-semibold text-navy">Choose your day(s)</h3>
        {bundleLabel && bundlePricePence != null && (
          <p className="mt-1 text-sm text-navy/60">
            {bundleLabel} for {formatCurrency(bundlePricePence)} — or {formatCurrency(days[0]?.pricePence ?? 0)} for
            any single day.
          </p>
        )}
        <div className="mt-3 space-y-2">
          {days.map((day) => (
            <label
              key={day.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-navy/10 px-4 py-3 text-sm"
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedDayIds.includes(day.id)}
                  onChange={() => toggleDay(day.id)}
                />
                <span>
                  <span className="font-medium text-navy">{day.label}</span>{" "}
                  <span className="text-navy/50">— {formatDate(day.date)}</span>
                </span>
              </span>
              <span className="text-navy/70">{formatCurrency(day.pricePence)}</span>
            </label>
          ))}
        </div>
      </div>

      {selectedDayIds.length > 0 && (
        <div className="rounded-lg bg-navy/[0.03] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-navy/70">
              Total {bundleApplied && "(bundle discount applied)"}
            </span>
            <span className="font-semibold text-navy">{formatCurrency(totalPence)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-navy/70">Deposit due today ({effectiveDepositPercent}%)</span>
            <span className="font-semibold text-navy">{formatCurrency(depositPence)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-navy/70">
              Balance due {balanceDueDate ? formatDate(balanceDueDate) : "later"}
            </span>
            <span className="text-navy">{formatCurrency(balancePence)}</span>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="childName" className="block text-sm font-medium text-navy">
          Child&apos;s full name
        </label>
        <input
          id="childName"
          required
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          className={inputClass}
        />
      </div>

      {visibleQuestions.map((q) => (
        <div key={q.id}>
          <label htmlFor={q.id} className="block text-sm font-medium text-navy">
            {q.label}
            {!q.required && <span className="font-normal text-navy/40"> (optional)</span>}
          </label>
          {q.type === "textarea" ? (
            <textarea
              id={q.id}
              rows={3}
              required={q.required}
              placeholder={q.placeholder}
              value={childAnswers[q.id] ?? ""}
              onChange={(e) => setChildAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className={inputClass}
            />
          ) : q.type === "select" ? (
            <select
              id={q.id}
              required={q.required}
              value={childAnswers[q.id] ?? ""}
              onChange={(e) => setChildAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className={inputClass}
            >
              <option value="" disabled>
                Select an option
              </option>
              {q.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={q.id}
              required={q.required}
              placeholder={q.placeholder}
              value={childAnswers[q.id] ?? ""}
              onChange={(e) => setChildAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              className={inputClass}
            />
          )}
        </div>
      ))}

      <div className="rounded-xl border border-navy/10 p-4">
        <button
          type="button"
          onClick={() => setShowTerms((v) => !v)}
          className="text-sm font-semibold text-navy underline"
        >
          {showTerms ? "Hide" : "Read"} the Course Terms &amp; Conditions
        </button>
        {showTerms && (
          <div className="prose-legal mt-4 space-y-4 text-sm leading-relaxed text-navy/80 [&_h2]:mt-6 [&_h2]:font-heading [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-navy [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_a]:underline">
            <CourseTermsContent />
          </div>
        )}

        <div className="mt-4">
          <label htmlFor="termsSignedName" className="block text-sm font-medium text-navy">
            Type your full name to sign
          </label>
          <input
            id="termsSignedName"
            required
            value={termsSignedName}
            onChange={(e) => setTermsSignedName(e.target.value)}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <label className="mt-3 flex items-start gap-2 text-sm text-navy/80">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          I have read and agree to the Course Terms &amp; Conditions above, and
          confirm that typing my name above is my electronic signature.
        </label>
      </div>

      {!isLoggedInClient && (
        <p className="text-sm text-navy/60">
          You&apos;ll need to be logged in to pay.{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          or{" "}
          <Link href="/register" className="underline">
            create an account
          </Link>{" "}
          first, then come back to this page to finish booking.
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={
          isPending ||
          selectedDayIds.length === 0 ||
          !childName.trim() ||
          !agreed ||
          termsSignedName.trim().length < 2
        }
      >
        {isPending ? "Redirecting to payment..." : `Pay deposit of ${formatCurrency(depositPence)}`}
      </Button>
    </form>
  );
}
