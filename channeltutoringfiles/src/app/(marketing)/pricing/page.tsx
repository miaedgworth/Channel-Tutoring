import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "How pricing works on Channel Tutoring — tutors set their own rates, with a flat £15 platform fee per completed session.",
};

export default function PricingPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Pricing
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Simple, transparent pricing for both clients and tutors.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardContent>
              <h2 className="font-heading text-lg font-semibold text-navy">
                For clients
              </h2>
              <p className="mt-3 text-sm text-navy/70">
                Each tutor sets their own hourly rate, shown clearly on their
                profile before you book — typically £25&ndash;£50 per hour
                depending on subject, level and experience. There are no
                extra booking fees for clients: the price you see is the
                price you pay.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <h2 className="font-heading text-lg font-semibold text-navy">
                For tutors
              </h2>
              <p className="mt-3 text-sm text-navy/70">
                You choose your own hourly rate. Channel Tutoring retains a
                flat <strong>£15 platform fee</strong> per completed
                session — regardless of your rate or session length — and
                the remainder is paid directly to you via Stripe.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 rounded-xl border border-navy/10 bg-navy/[0.02] p-6">
          <h2 className="font-heading text-lg font-semibold text-navy">
            Example
          </h2>
          <p className="mt-2 text-sm text-navy/70">
            A tutor charging £40/hour for a 60-minute session: the client
            pays £40, Channel Tutoring retains £15, and £25 is paid to the
            tutor.
          </p>
        </div>

        <p className="mt-8 text-center text-sm text-navy/50">
          See our{" "}
          <a href="/legal/cancellation-refund-policy" className="underline">
            Cancellation &amp; Refund Policy
          </a>{" "}
          for details on cancelling or rescheduling a session.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/find-a-tutor" variant="gold">
            Find a Tutor
          </LinkButton>
          <LinkButton href="/join-as-a-tutor" variant="outline">
            Become a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
