import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Cancellation & Refund Policy" };

export default function CancellationRefundPolicyPage() {
  return (
    <LegalPage title="Cancellation &amp; Refund Policy" lastUpdated="26 August 2026">
      <h2>How charging works</h2>
      <p>
        Buying lesson tokens and arranging a session are two separate
        steps. Once you&apos;ve agreed a date and time with a tutor, they
        schedule the session on the platform — this reserves the right
        number of tokens for the session length straight away, and it
        appears as an upcoming session on your dashboard. Your tutor is
        only paid once the session has taken place and they&apos;ve marked
        it as complete.
      </p>
      <p>
        If a tutor teaches a session that wasn&apos;t scheduled in advance,
        they can instead log it as a completed lesson afterwards, which
        uses a token and pays them in one step.
      </p>

      <h2>Changing or cancelling a scheduled session</h2>
      <p>
        If you need to change or cancel a session that&apos;s been
        scheduled, message your tutor through Channel Tutoring as soon as
        you can. If the session won&apos;t be going ahead, your tutor
        cancels it on the platform and your reserved tokens are refunded
        to your balance in full, automatically.
      </p>

      <h2>Lessons logged or marked complete in error</h2>
      <p>
        If a tutor marks a session complete, or logs a completed lesson,
        by mistake, they can undo it within 24 hours. This refunds the
        exact number of tokens used and reverses their payout. If
        it&apos;s outside that 24-hour window, contact us at{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>{" "}
        and we&apos;ll sort it out.
      </p>

      <h2>No-shows</h2>
      <p>
        Tutors only mark a session complete — and get paid — once it has
        actually taken place, so a client no-show shouldn&apos;t result in
        a tutor being paid. If a tutor doesn&apos;t attend a scheduled
        session, please contact us so we can look into it and, where
        appropriate, cancel the session and refund your tokens.
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
