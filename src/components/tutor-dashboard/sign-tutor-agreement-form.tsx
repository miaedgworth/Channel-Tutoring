"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signTutorAgreement } from "@/lib/actions/tutor-agreement";

export function SignTutorAgreementForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signTutorAgreement(fullName);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/tutor-dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-navy">Sign the agreement</h2>
      {error && (
        <p role="alert" className="text-sm text-red">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-navy">
          Type your full name
        </label>
        <input
          id="fullName"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-md border border-navy/20 px-3 py-2 text-sm focus:border-navy focus:outline-none"
          placeholder="Your full name"
        />
      </div>
      <p className="text-sm text-navy/60">Date: {today}</p>
      <label className="flex items-start gap-2 text-sm text-navy/80">
        <input
          type="checkbox"
          required
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5"
        />
        I have read and agree to the Tutor Agreement above, and confirm that
        typing my name above is my electronic signature.
      </label>
      <Button type="submit" disabled={isPending || !agreed || fullName.trim().length < 2}>
        {isPending ? "Signing..." : "Sign agreement"}
      </Button>
    </form>
  );
}
