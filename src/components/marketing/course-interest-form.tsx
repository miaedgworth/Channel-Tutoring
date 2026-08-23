"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

export function CourseInterestForm({ courseId }: { courseId: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/course-interest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, name, email, phone, message }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="font-medium text-navy">Thanks — we&apos;ve got your details.</p>
        <p className="mt-1 text-sm text-navy/70">
          We&apos;ll be in touch as soon as booking opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ci-name" className="block text-sm font-medium text-navy">
            Full name
          </label>
          <input
            id="ci-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="ci-email" className="block text-sm font-medium text-navy">
            Email address
          </label>
          <input
            id="ci-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="ci-phone" className="block text-sm font-medium text-navy">
          Phone number (optional)
        </label>
        <input
          id="ci-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="ci-message" className="block text-sm font-medium text-navy">
          Anything we should know? (optional)
        </label>
        <textarea
          id="ci-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
          placeholder="e.g. year group, subjects of interest"
        />
      </div>
      <Button type="submit" variant="gold" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Express Interest"}
      </Button>
    </form>
  );
}
