import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "How It Works",
  description: "How booking a tutor works on Channel Tutoring.",
};

const CLIENT_STEPS = [
  {
    title: "1. Search for a tutor",
    body: "Use Find a Tutor to filter by subject and level (KS3, GCSE, A-Level or university admissions). Every tutor's profile shows their experience, qualifications and reviews. Pricing is fixed by level, so it's the same wherever you book.",
  },
  {
    title: "2. Pick a time and book",
    body: "Choose from your tutor's published availability and confirm your session details — subject, level, exam board and any notes for your tutor.",
  },
  {
    title: "3. Pay securely online",
    body: "Payment is taken securely via Stripe at the time of booking. You'll get an email confirmation and receipt, and can view it any time in your dashboard.",
  },
  {
    title: "4. Message your tutor",
    body: "Use in-app messaging to arrange details or ask questions before your session. All messages stay on the platform for everyone's safety.",
  },
  {
    title: "5. Attend your session",
    body: "After your session, you can leave a review to help other families choose the right tutor.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            How It Works
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Here&apos;s exactly what to expect when booking a tutor.
          </p>
        </div>

        <section className="mt-14">
          <div className="space-y-6">
            {CLIENT_STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-navy/10 p-5">
                <h3 className="font-heading text-base font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <LinkButton href="/find-a-tutor" variant="gold">
              Find a Tutor
            </LinkButton>
          </div>
        </section>
      </Container>
    </div>
  );
}
