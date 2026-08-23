import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">Welcome back</h1>
      <p className="mt-1 text-sm text-navy/60">
        Log in to manage your bookings, messages and account.
      </p>
      <div className="mt-8">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
