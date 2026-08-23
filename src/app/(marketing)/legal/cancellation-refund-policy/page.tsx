import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Cancellation & Refund Policy" };

export default function CancellationRefundPolicyPage() {
  return (
    <LegalPage title="Cancellation &amp; Refund Policy" lastUpdated="21 August 2026">
      <h2>Client cancellations</h2>
      <ul>
        <li>
          <strong>More than 24 hours before the session:</strong> free
          cancellation, with a full refund issued automatically to your
          original payment method.
        </li>
        <li>
          <strong>Within 24 hours of the session:</strong> 50% of the
          lesson fee remains payable, in fairness to the tutor who has
          reserved that time for you. The other 50% is refunded
          automatically.
        </li>
      </ul>
      <p>
        You can cancel a booking at any time from your dashboard. Refunds
        (where applicable) are processed automatically via Stripe and
        typically appear within 5&ndash;10 business days, depending on your
        bank.
      </p>

      <h2>Tutor-initiated cancellations</h2>
      <p>
        If a tutor needs to cancel a confirmed session, the client
        receives a full refund regardless of how close to the session it
        is. We expect tutors to only cancel when genuinely necessary, and
        repeated cancellations may affect a tutor&apos;s account standing.
      </p>

      <h2>Failed or disputed payments</h2>
      <p>
        If a payment fails, the booking is not confirmed and the time slot
        remains available for others to book. If you believe a payment was
        taken in error, contact us at{" "}
        <a href="mailto:hello@channeltutoring.gg">hello@channeltutoring.gg</a>{" "}
        and we&apos;ll investigate.
      </p>

      <h2>No-shows</h2>
      <p>
        If a client doesn&apos;t attend a confirmed session without
        cancelling in advance, no refund is given. If a tutor doesn&apos;t
        attend a confirmed session, the client is entitled to a full
        refund — please contact us so we can arrange this.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about a specific booking? Email{" "}
        <a href="mailto:hello@channeltutoring.gg">hello@channeltutoring.gg</a>{" "}
        with your booking details.
      </p>
    </LegalPage>
  );
}
