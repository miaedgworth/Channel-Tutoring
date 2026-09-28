"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }

    setVerified(true);
  }

  async function handleResend() {
    setResending(true);
    setResendMessage(null);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setResending(false);
    setResendMessage("If that email needs verifying, a new code is on its way.");
  }

  if (verified) {
    return (
      <div>
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Your email is verified. You can now log in.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm underline text-navy">
          Go to log in
        </Link>
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
      {resendMessage && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {resendMessage}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-navy">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-navy">
          Verification code
        </label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={loading || code.length !== 6}>
        {loading ? "Verifying..." : "Verify"}
      </Button>

      <p className="text-center text-sm text-navy/60">
        Didn&apos;t get a code?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || !email}
          className="font-semibold text-navy underline disabled:opacity-50"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
      </p>
    </form>
  );
}
