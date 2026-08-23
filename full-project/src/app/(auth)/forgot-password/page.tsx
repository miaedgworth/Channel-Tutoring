import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">
        Reset your password
      </h1>
      <p className="mt-1 text-sm text-navy/60">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>
      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
