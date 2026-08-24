import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyGBP } from "@/lib/utils";
import {
  LEVELS,
  LEVEL_PRICE_PENCE,
  ADDITIONAL_STUDENT_SURCHARGE_PENCE,
  BLOCK_BOOKING_MIN_SESSIONS,
  BLOCK_BOOKING_DISCOUNT_RATE,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing",
  description: "How pricing works on Channel Tutoring.",
};

export default function PricingPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Pricing
          </h1>
        </div>

        <div className="mt-12">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10">
                    <th className="px-5 py-3 font-semibold text-navy">Level</th>
                    <th className="px-5 py-3 font-semibold text-navy">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {LEVELS.map((l) => (
                    <tr key={l.value} className="border-b border-navy/5 last:border-0">
                      <td className="px-5 py-3 text-navy/80">{l.label}</td>
                      <td className="px-5 py-3 font-semibold text-navy">
                        {formatCurrencyGBP(LEVEL_PRICE_PENCE[l.value])}/hour
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Group lessons
            </h2>
            <p className="mt-2 text-sm text-navy/70">
              For lessons with more than one student, add{" "}
              {formatCurrencyGBP(ADDITIONAL_STUDENT_SURCHARGE_PENCE)}/hour
              per additional student. Message your tutor to arrange this and
              they&apos;ll confirm the adjusted price when they schedule the
              lesson.
            </p>
          </div>
          <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Block booking discount
            </h2>
            <p className="mt-2 text-sm text-navy/70">
              Buy lessons individually, or ask your tutor to schedule{" "}
              {BLOCK_BOOKING_MIN_SESSIONS} or more sessions in one block to
              get {Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% off,
              applied automatically.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-navy/50">
          Cancelling within 24 hours of a session is charged at 50% of the
          fee. See our{" "}
          <a href="/legal/cancellation-refund-policy" className="underline">
            Cancellation &amp; Refund Policy
          </a>{" "}
          and{" "}
          <a href="/legal/registration-agreement" className="underline">
            Registration Agreement
          </a>{" "}
          for full details.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <LinkButton href="/find-a-tutor" variant="gold">
            Find a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
