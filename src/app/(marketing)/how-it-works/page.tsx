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
    body: "Use Find a Tutor to filter by subject and level (KS3, GCSE, A-Level or university admissions). Every tutor's profile shows their qualifications, reviews and general availability — the days and times of day they're usually free. Pricing is fixed by level, so it's the same wherever you book.",
  },
  {
    title: "2. Buy tokens for your level",
    body: "Buy lesson tokens for the level you need, individually or in a block of 5+ for 10% off. One token is redeemable against one lesson at that level, with any tutor.",
  },
  {
    title: "3. Message your tutor",
    body: "Use in-app messaging to agree a day and time with your tutor, along with subject, level and exam board. All messages stay on the platform for everyone's safety.",
  },
  {
    title: "4. Attend your session",
    body: "After the lesson, your tutor logs it as complete, which uses one of your tokens for that level and pays them automatically — no extra step needed from you.",
  },
  {
    title: "5. Leave a review",
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
