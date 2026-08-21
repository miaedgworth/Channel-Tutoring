import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-navy">
        Create your account
      </h1>
      <p className="mt-1 text-sm text-navy/60">
        Sign up as a client to browse tutors and book lessons.
      </p>
      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
