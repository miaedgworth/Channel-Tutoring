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
              per additional student. Message your tutor to arrange this.
            </p>
          </div>
          <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-6">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Block token discount
            </h2>
            <p className="mt-2 text-sm text-navy/70">
              Buy lesson tokens individually, or buy{" "}
              {BLOCK_BOOKING_MIN_SESSIONS} or more at once to get{" "}
              {Math.round(BLOCK_BOOKING_DISCOUNT_RATE * 100)}% off,
              applied automatically. Tokens don&apos;t expire and work with
              any tutor teaching that level.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-navy/50">
          One token is redeemable against one lesson at that level. See our{" "}
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
