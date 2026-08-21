import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Tutor Agreement" };

export default function TutorAgreementPage() {
  return (
    <LegalPage title="Tutor Agreement" lastUpdated="21 August 2026">
      <p>
        This agreement applies to anyone approved as a tutor on the Channel
        Tutoring platform. By completing your tutor application and
        accepting an approved account, you agree to these terms in addition
        to our general{" "}
        <a href="/legal/terms">Terms &amp; Conditions</a>.
      </p>

      <h2>1. Independent contractor status</h2>
      <p>
        You provide tutoring services as an independent contractor, not as
        an employee, worker or agent of Channel Tutoring. You are
        responsible for your own tax and National Insurance/social security
        obligations in respect of income earned through the platform.
      </p>

      <h2>2. Vetting and DBS checks</h2>
      <ul>
        <li>You must provide accurate information about your qualifications, experience and DBS (criminal record) check status.</li>
        <li>Your public profile will not be published until your DBS status has been verified by our team.</li>
        <li>You must notify us immediately of any change to your DBS status or any safeguarding-relevant matter.</li>
      </ul>

      <h2>3. Fees</h2>
      <p>
        You set your own hourly rate. Channel Tutoring retains a flat
        platform fee (currently <strong>£15</strong>) from each completed
        session, deducted automatically via Stripe Connect at the time of
        payment; the remainder is paid to you. This fee structure may be
        updated from time to time, with reasonable notice.
      </p>

      <h2>4. Payments and payouts</h2>
      <ul>
        <li>You must connect a valid bank account via Stripe Connect to receive payouts.</li>
        <li>Your available balance can be withdrawn on demand, subject to Stripe&apos;s standard processing times.</li>
        <li>You can view a full ledger of your sessions, fees and payouts in your tutor dashboard.</li>
      </ul>

      <h2>5. Cancellations</h2>
      <p>
        If you cancel a confirmed session, the client is entitled to a full
        refund. Repeated cancellations may affect your standing on the
        platform. See our{" "}
        <a href="/legal/cancellation-refund-policy">
          Cancellation &amp; Refund Policy
        </a>{" "}
        for full details.
      </p>

      <h2>6. Conduct and communication</h2>
      <p>
        All communication with clients must take place through the Channel
        Tutoring messaging system. You must not request or share personal
        contact details, or attempt to arrange payment or sessions outside
        the platform. See our{" "}
        <a href="/legal/acceptable-use-policy">Acceptable Use Policy</a> and{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a>.
      </p>

      <h2>7. Profile accuracy</h2>
      <p>
        Your public profile (bio, qualifications, subjects, rate) must be
        accurate and kept up to date. We may unpublish or edit a profile
        that we believe to be inaccurate or misleading.
      </p>

      <h2>8. Suspension and termination</h2>
      <p>
        We may suspend or terminate your account for breach of this
        agreement, our Acceptable Use Policy, or our Safeguarding Policy,
        or if a safeguarding concern is raised. You may stop tutoring on
        the platform at any time by contacting us.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about this agreement? Email{" "}
        <a href="mailto:tutors@channeltutoring.gg">tutors@channeltutoring.gg</a>.
      </p>
    </LegalPage>
  );
}
