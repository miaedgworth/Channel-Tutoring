import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms &amp; Conditions" lastUpdated="21 August 2026">
      <p>
        These Terms &amp; Conditions govern your use of the Channel Tutoring
        platform. By creating an account or using the platform, you agree to
        these terms. If you are booking for a child under 18, you confirm you
        are their parent or legal guardian and are agreeing on their behalf.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Channel Tutoring is a Guernsey-based platform that connects clients
        with independent tutors. We are not a party to the tutoring
        agreement itself — tutors provide their services as independent
        contractors, not as employees of Channel Tutoring.
      </p>

      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information when creating an account.</li>
        <li>You are responsible for keeping your login details secure.</li>
        <li>We may suspend or terminate accounts that breach these terms, our Acceptable Use Policy, or our Safeguarding Policy.</li>
      </ul>

      <h2>3. Bookings and payments</h2>
      <ul>
        <li>Session prices are fixed by level and the same for every tutor &mdash; see our <a href="/pricing">Pricing</a> page.</li>
        <li>Payment is taken in full at the time of booking via our payment processor, Stripe.</li>
        <li>Channel Tutoring retains a flat platform fee (currently £15) from each completed session; the remainder is paid to the tutor.</li>
        <li>See our <a href="/legal/cancellation-refund-policy">Cancellation &amp; Refund Policy</a> for cancellation terms.</li>
      </ul>

      <h2>4. Tutor status</h2>
      <p>
        Tutors on Channel Tutoring are independent contractors, not
        employees, workers or agents of Channel Tutoring. Full terms for
        tutors are set out in our{" "}
        <a href="/legal/tutor-agreement">Tutor Agreement</a>.
      </p>

      <h2>5. Conduct and safeguarding</h2>
      <p>
        All use of the platform, including messaging, is subject to our{" "}
        <a href="/legal/acceptable-use-policy">Acceptable Use Policy</a> and{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a>. We
        monitor in-app messages for safeguarding purposes and may suspend
        accounts that attempt to move communication or payment off-platform.
      </p>

      <h2>6. Limitation of liability</h2>
      <p>
        Channel Tutoring provides a platform to connect clients and tutors.
        While we vet tutors before their profile goes live, we cannot
        guarantee academic outcomes. To the maximum extent permitted by
        law, our liability is limited to the fees paid for the specific
        booking in question.
      </p>

      <h2>7. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. We&apos;ll post the
        updated version here with a new &ldquo;last updated&rdquo; date.
        Continued use of the platform after changes means you accept the
        updated terms.
      </p>

      <h2>8. Governing law</h2>
      <p>These terms are governed by the laws of Guernsey.</p>

      <h2>9. Contact</h2>
      <p>
        Questions about these terms? Email{" "}
        <a href="mailto:hello@channeltutoring.gg">hello@channeltutoring.gg</a>.
      </p>
    </LegalPage>
  );
}
