import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";

export const metadata: Metadata = { title: "Verify Email" };

export default function VerifyEmailPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">
        Verify your email
      </h1>
      <p className="mt-1 text-sm text-navy/60">
        Enter the 6-digit code we emailed you to activate your account.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <VerifyEmailForm />
        </Suspense>
      </div>
    </div>
  );
}
