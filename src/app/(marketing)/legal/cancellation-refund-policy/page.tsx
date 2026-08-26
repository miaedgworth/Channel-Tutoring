import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Cancellation & Refund Policy" };

export default function CancellationRefundPolicyPage() {
  return (
    <LegalPage title="Cancellation &amp; Refund Policy" lastUpdated="26 August 2026">
      <h2>How charging works</h2>
      <p>
        Buying lesson tokens and arranging a session are two separate
        steps. Tokens are only ever used once a session has actually taken
        place: your tutor logs it as complete afterwards, which is the
        point a token is deducted from your balance and your tutor is
        paid. Nothing is charged in advance for a specific date or time,
        so there&apos;s nothing to refund for a session that never
        happened.
      </p>

      <h2>Changing or cancelling a planned session</h2>
      <p>
        If you need to change or cancel a session you&apos;ve arranged
        with a tutor, just message them through Channel Tutoring as soon
        as you can. Since no token is used until the tutor logs the
        session as complete, cancelling or rescheduling in advance doesn&apos;t
        cost you anything.
      </p>

      <h2>Lessons logged in error</h2>
      <p>
        If a tutor logs a session as complete by mistake, they can undo it
        within 24 hours of logging it. This refunds the exact number of
        tokens used and reverses their payout. If it&apos;s outside that
        24-hour window, contact us at{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>{" "}
        and we&apos;ll sort it out.
      </p>

      <h2>No-shows</h2>
      <p>
        Tutors only log — and get paid for — sessions that actually took
        place, so a client no-show shouldn&apos;t result in any tokens
        being used. If a tutor doesn&apos;t attend a session you&apos;d
        arranged, please contact us so we can look into it.
      </p>

      <h2>Failed or disputed token purchases</h2>
      <p>
        If a card payment for tokens fails, no tokens are added to your
        account. If you believe you were charged in error, or want to
        request a refund for tokens you haven&apos;t used, contact us at{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>{" "}
        and we&apos;ll review it. Unused tokens don&apos;t expire.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about a specific booking? Email{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>{" "}
        with your booking details.
      </p>
    </LegalPage>
  );
}
