import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { TutorApplicationForm } from "@/components/tutor-application/application-form";

export const metadata: Metadata = {
  title: "Join as a Tutor",
  description:
    "Apply to become a Channel Tutoring tutor. Set your own rate, choose your own hours, and get paid securely through the platform.",
};

export default function JoinAsATutorPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Tutor with Channel Tutoring
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy/70">
            Join a trusted network of GCSE and A-Level tutors across
            Guernsey. Set your own hourly rate, choose your own hours, and
            we&apos;ll handle bookings, payments and admin — you focus on
            teaching.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Set your own rate",
              body: "You decide your hourly rate — we take a flat £15 platform fee per completed session, nothing more.",
            },
            {
              title: "Flexible hours",
              body: "Tutor as many or as few hours as suits you, around your existing commitments.",
            },
            {
              title: "Secure payments",
              body: "Get paid directly to your bank account via Stripe, with a clear earnings ledger.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-navy/10 bg-navy/[0.02] p-5"
            >
              <h3 className="font-heading text-base font-semibold text-navy">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-navy/60">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-10">
          <TutorApplicationForm />
        </div>
      </Container>
    </div>
  );
}
