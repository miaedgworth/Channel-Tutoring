"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasInPersonSessions, setHasInPersonSessions] = useState(false);
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [addressTown, setAddressTown] = useState("");
  const [addressPostcode, setAddressPostcode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("Please confirm you agree to the Registration Agreement to continue.");
      return;
    }
    if (hasInPersonSessions && (!addressLine1.trim() || !addressTown.trim() || !addressPostcode.trim())) {
      setError("Please enter your address for in-person sessions.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        newsletterOptIn,
        agreedToTerms,
        hasInPersonSessions,
        addressLine1,
        addressLine2,
        addressTown,
        addressPostcode,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-navy">
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
      </div>

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
        <label htmlFor="password" className="block text-sm font-medium text-navy">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
        />
        <p className="mt-1 text-xs text-navy/50">At least 8 characters.</p>
      </div>

      <div>
        <span className="block text-sm font-medium text-navy">
          Will you be having in-person sessions?
        </span>
        <div className="mt-1.5 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-navy/80">
            <input
              type="radio"
              name="hasInPersonSessions"
              checked={!hasInPersonSessions}
              onChange={() => setHasInPersonSessions(false)}
            />
            No, online only
          </label>
          <label className="flex items-center gap-2 text-sm text-navy/80">
            <input
              type="radio"
              name="hasInPersonSessions"
              checked={hasInPersonSessions}
              onChange={() => setHasInPersonSessions(true)}
            />
            Yes
          </label>
        </div>
      </div>

      {hasInPersonSessions && (
        <div className="space-y-4 rounded-md border border-navy/10 bg-navy/[0.03] p-4">
          <p className="text-xs text-navy/60">
            We&apos;ll only share your address with a tutor once an
            in-person session with them is confirmed.
          </p>
          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-navy">
              Address
            </label>
            <input
              id="addressLine1"
              type="text"
              required={hasInPersonSessions}
              autoComplete="address-line1"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
            />
            <input
              id="addressLine2"
              type="text"
              autoComplete="address-line2"
              placeholder="Address line 2 (optional)"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="mt-2 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="addressTown" className="block text-sm font-medium text-navy">
                Town
              </label>
              <input
                id="addressTown"
                type="text"
                required={hasInPersonSessions}
                autoComplete="address-level2"
                value={addressTown}
                onChange={(e) => setAddressTown(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
              />
            </div>
            <div>
              <label htmlFor="addressPostcode" className="block text-sm font-medium text-navy">
                Postcode
              </label>
              <input
                id="addressPostcode"
                type="text"
                required={hasInPersonSessions}
                autoComplete="postal-code"
                value={addressPostcode}
                onChange={(e) => setAddressPostcode(e.target.value)}
                className="mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark"
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-md border border-navy/10 bg-navy/[0.03] p-3">
        <input
          id="newsletterOptIn"
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => setNewsletterOptIn(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
        />
        <label htmlFor="newsletterOptIn" className="text-sm text-navy/80">
          Send me occasional tutoring tips, news and offers by email. You can
          unsubscribe at any time — see our{" "}
          <Link href="/legal/privacy-policy" className="underline">
            Privacy Policy
          </Link>
          .
        </label>
      </div>

      <div className="flex items-start gap-3 rounded-md border border-navy/10 bg-navy/[0.03] p-3">
        <input
          id="agreedToTerms"
          type="checkbox"
          required
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-navy/30 text-gold-dark focus:ring-gold-dark"
        />
        <label htmlFor="agreedToTerms" className="text-sm text-navy/80">
          I have read and agree to the{" "}
          <Link href="/legal/registration-agreement" className="underline" target="_blank">
            Registration and Agreement Form
          </Link>
          , including the pricing, cancellation policy and safeguarding
          terms it sets out.
        </label>
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create Account"}
      </Button>

      <p className="text-center text-sm text-navy/70">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy underline">
          Log in
        </Link>
      </p>

      <p className="text-center text-xs text-navy/50">
        By signing up you also agree to our{" "}
        <Link href="/legal/terms" className="underline">
          Terms &amp; Conditions
        </Link>{" "}
        and{" "}
        <Link href="/legal/privacy-policy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </form>
  );
}
