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

export interface WizardDay {
  id: string;
  date: string;
  label: string;
  track: CourseDayTrack;
  pricePence: number;
  soldOut: boolean;
  spotsLeft: number | null;
}

type Phase = "cta" | "authGate" | "days" | "details" | "terms";

const STEP_NUMBER: Record<Phase, number | null> = {
  cta: null,
  authGate: null,
  days: 1,
  details: 2,
  terms: 3,
};

export function CourseBookingWizard({
  courseTitle,
  courseSlug,
  days,
  bundlePricePence,
  bundleLabel,
  depositPercent,
  balanceDueDate,
  isLoggedInClient,
}: {
  courseTitle: string;
  courseSlug: string;
  days: WizardDay[];
  bundlePricePence: number | null;
  bundleLabel: string | null;
  depositPercent: number | null;
  balanceDueDate: string | null;
  isLoggedInClient: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("cta");
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [childName, setChildName] = useState("");
  const [childAnswers, setChildAnswers] = useState<Record<string, string>>({});
  const [termsSignedName, setTermsSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const returnUrl = `/courses/${courseSlug}`;
  const effectiveDepositPercent = depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;

  const { totalPence, bundleApplied } = useMemo(
    () => computeCoursePrice({ bundlePricePence, days }, selectedDayIds),
    [bundlePricePence, days, selectedDayIds],
  );
  const selectedDays = useMemo(
    () => days.filter((d) => selectedDayIds.includes(d.id)),
    [days, selectedDayIds],
  );
  const selectedTracks = useMemo(() => new Set(selectedDays.map((d) => d.track)), [selectedDays]);
  const visibleQuestions = useMemo(
    () => COURSE_CHILD_QUESTIONS.filter((q) => !q.showIfTrack || selectedTracks.has(q.showIfTrack)),
    [selectedTracks],
  );
  const { depositPence, balancePence } = useMemo(
    () => splitDepositAndBalance(totalPence, effectiveDepositPercent),
    [totalPence, effectiveDepositPercent],
  );
  const detailsComplete =
    childName.trim().length > 0 &&
    visibleQuestions.every((q) => !q.required || (childAnswers[q.id]?.trim() ?? "").length > 0);

  function toggleDay(dayId: string) {
    if (days.find((d) => d.id === dayId)?.soldOut) return;
    setSelectedDayIds((prev) =>
      prev.includes(dayId) ? prev.filter((id) => id !== dayId) : [...prev, dayId],
    );
  }

  function handleStartBooking() {
    setPhase(isLoggedInClient ? "days" : "authGate");
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

  const stepNumber = STEP_NUMBER[phase];

  return (
    <div>
      {stepNumber && (
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-navy/40">
          Step {stepNumber} of 3
        </p>
      )}

      {phase === "cta" && (
        <Button type="button" size="lg" onClick={handleStartBooking}>
          Book your place
        </Button>
      )}

      {phase === "authGate" && (
        <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-5">
          <h3 className="font-heading text-base font-semibold text-navy">
            Create an account to book your place
          </h3>
          <p className="mt-1.5 text-sm text-navy/70">
            You&apos;ll need an account to book onto {courseTitle} and pay online.
            It only takes a minute.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`/register?callbackUrl=${encodeURIComponent(returnUrl)}`}>
              <Button type="button">Create an account</Button>
            </Link>
            <Link href={`/login?callbackUrl=${encodeURIComponent(returnUrl)}`}>
              <Button type="button" variant="outline">
                I already have an account
              </Button>
            </Link>
          </div>
        </div>
      )}

      {phase === "days" && (
        <div className="space-y-6">
          <div>
            <h3 className="font-heading text-sm font-semibold text-navy">Choose your day(s)</h3>
            {bundleLabel && bundlePricePence != null && (
              <p className="mt-1 text-sm text-navy/60">
                {bundleLabel} for {formatCurrency(bundlePricePence)} — or{" "}
                {formatCurrency(days[0]?.pricePence ?? 0)} for any single day.
              </p>
            )}
            <div className="mt-3 space-y-2">
              {days.map((day) => (
                <label
                  key={day.id}
                  className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
                    day.soldOut ? "border-navy/10 bg-navy/[0.02] opacity-60" : "border-navy/10"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedDayIds.includes(day.id)}
                      onChange={() => toggleDay(day.id)}
                      disabled={day.soldOut}
                    />
                    <span>
                      <span className="font-medium text-navy">{day.label}</span>{" "}
                      <span className="text-navy/50">— {formatDate(day.date)}</span>
                      {!day.soldOut && day.spotsLeft != null && day.spotsLeft <= 3 && (
                        <span className="ml-2 text-xs font-semibold text-red">
                          {day.spotsLeft === 1 ? "1 spot left" : `${day.spotsLeft} spots left`}
                        </span>
                      )}
                    </span>
                  </span>
                  {day.soldOut ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                      Sold out
                    </span>
                  ) : (
                    <span className="text-navy/70">{formatCurrency(day.pricePence)}</span>
                  )}
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

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setPhase("cta")}>
              Back
            </Button>
            <Button
              type="button"
              disabled={selectedDayIds.length === 0}
              onClick={() => setPhase("details")}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {phase === "details" && (
        <div className="space-y-5">
          <p className="text-sm text-navy/60">
            Booking: {selectedDays.map((d) => d.label).join(", ")} — total{" "}
            {formatCurrency(totalPence)}
          </p>

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

          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => setPhase("days")}>
              Back
            </Button>
            <Button type="button" disabled={!detailsComplete} onClick={() => setPhase("terms")}>
              Next
            </Button>
          </div>
        </div>
      )}

      {phase === "terms" && (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && (
            <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
              {error}
            </p>
          )}

          <p className="text-sm text-navy/60">
            Booking: {selectedDays.map((d) => d.label).join(", ")} — total{" "}
            {formatCurrency(totalPence)}, deposit {formatCurrency(depositPence)} due today.
          </p>

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

          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="ghost" onClick={() => setPhase("details")}>
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isPending || !agreed || termsSignedName.trim().length < 2}
            >
              {isPending ? "Redirecting to payment..." : `Pay deposit of ${formatCurrency(depositPence)}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
