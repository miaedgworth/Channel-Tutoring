import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { TutorApplicationForm } from "@/components/tutor-application/application-form";

export const metadata: Metadata = {
  title: "Join as a Tutor",
  description:
    "Apply to become a Channel Tutoring tutor. Fixed, fair session rates, choose your own hours, and get paid securely through the platform.",
};

const TUTOR_STEPS = [
  {
    title: "1. Apply online",
    body: "Tell us about your subjects, qualifications and experience via the application form below.",
  },
  {
    title: "2. Get approved",
    body: "Our team reviews every application. Once approved, you'll receive an email to set up your account and complete your public profile.",
  },
  {
    title: "3. Publish your availability",
    body: "Session prices are fixed by Channel Tutoring based on level, the same for every tutor — see our Pricing page. Just publish availability slots whenever suits you.",
  },
  {
    title: "4. Get booked and paid",
    body: "Clients book directly into your available slots and pay upfront. Channel Tutoring retains a platform fee per completed session — you keep the rest (see the Tutor Agreement for the exact amount).",
  },
  {
    title: "5. Withdraw your earnings",
    body: "Track everything in your earnings dashboard and withdraw your available balance to your bank account whenever you like.",
  },
];

export default function JoinAsATutorPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Tutor with Channel Tutoring
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-navy/70">
            Join a trusted network of tutors across Guernsey, from KS3
            through to university admissions. Fixed, fair session rates,
            choose your own hours, and we&apos;ll handle bookings, payments
            and admin — you focus on teaching.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Fixed, fair rates",
              body: "Session prices are set by level and the same for every tutor — we take a flat platform fee per completed session, nothing more.",
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

        <section className="mt-16">
          <h2 className="text-center font-heading text-2xl font-bold text-navy">
            How it works
          </h2>
          <div className="mt-8 space-y-6">
            {TUTOR_STEPS.map((s) => (
              <div key={s.title} className="rounded-xl border border-navy/10 p-5">
                <h3 className="font-heading text-base font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="mt-1.5 text-sm text-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-10">
          <TutorApplicationForm />
        </div>
      </Container>
    </div>
  );
}
