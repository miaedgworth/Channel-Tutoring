"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div
      className="mt-1.5 flex items-center gap-1"
      role="radiogroup"
      aria-label="Star rating out of 5"
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onBlur={() => setHovered(null)}
          onClick={() => onChange(star)}
          className="p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark rounded"
        >
          <svg
            viewBox="0 0 20 20"
            className={cn(
              "h-8 w-8 transition-colors",
              star <= display ? "fill-gold text-gold" : "fill-transparent text-navy/25",
            )}
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77-4.19-4.09 5.79-.84L10 1.5z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export function FeedbackForm() {
  const [clientName, setClientName] = useState("");
  const [tutorName, setTutorName] = useState("");
  const [rating, setRating] = useState(0);
  const [helpfulText, setHelpfulText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [consentToShare, setConsentToShare] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        tutorName,
        rating,
        helpfulText,
        improveText,
        consentToShare,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-heading text-xl font-bold text-navy">
          Thank you for your feedback
        </h2>
        <p className="mt-2 text-sm text-navy/70">
          We really appreciate you taking the time to share this with us.
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

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-navy">
            Your name
          </label>
          <input
            id="clientName"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="tutorName" className="block text-sm font-medium text-navy">
            Your tutor&apos;s name
          </label>
          <input
            id="tutorName"
            required
            value={tutorName}
            onChange={(e) => setTutorName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-navy">
          How would you rate your session(s)?
        </span>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>

      <div>
        <label htmlFor="helpfulText" className="block text-sm font-medium text-navy">
          What did you find helpful?
        </label>
        <textarea
          id="helpfulText"
          required
          rows={4}
          value={helpfulText}
          onChange={(e) => setHelpfulText(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="improveText" className="block text-sm font-medium text-navy">
          Is there anything you&apos;d like to see improved?
        </label>
        <textarea
          id="improveText"
          rows={4}
          value={improveText}
          onChange={(e) => setImproveText(e.target.value)}
          className={inputClass}
          placeholder="Optional"
        />
      </div>

      <label className="flex items-start gap-2.5 text-sm text-navy/80">
        <input
          type="checkbox"
          checked={consentToShare}
          onChange={(e) => setConsentToShare(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
        />
        <span>
          I&apos;m happy for this feedback to be shared anonymously on
          Channel Tutoring&apos;s social media and website.
        </span>
      </label>

      <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
