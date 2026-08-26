import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Registration and Agreement Form",
  description:
    "The pricing, cancellation, booking and safeguarding terms every client agrees to when registering with Channel Tutoring.",
};

export default function RegistrationAgreementPage() {
  return (
    <LegalPage title="Registration and Agreement Form" lastUpdated="26 August 2026">
      <p>
        This is the agreement you accept when you create a client account
        with Channel Tutoring, on behalf of yourself and/or the student(s)
        you register. It sets out our pricing and the key terms of service
        for booking sessions. It applies alongside our general{" "}
        <a href="/legal/terms">Terms &amp; Conditions</a> and{" "}
        <a href="/legal/privacy-policy">Privacy Policy</a>.
      </p>

      <h2>Pricing and payment</h2>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-navy/15">
            <th className="py-2 pr-4 font-semibold text-navy">Level</th>
            <th className="py-2 font-semibold text-navy">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-navy/10">
            <td className="py-2 pr-4">KS3 Lessons (Years 7&ndash;9)</td>
            <td className="py-2">£35/hour</td>
          </tr>
          <tr className="border-b border-navy/10">
            <td className="py-2 pr-4">GCSE Lessons (Years 10&ndash;11)</td>
            <td className="py-2">£40/hour</td>
          </tr>
          <tr className="border-b border-navy/10">
            <td className="py-2 pr-4">A-Level Lessons (Years 12&ndash;13)</td>
            <td className="py-2">£45/hour</td>
          </tr>
          <tr>
            <td className="py-2 pr-4">University Admissions / Interview Technique</td>
            <td className="py-2">£50/hour</td>
          </tr>
        </tbody>
      </table>
      <p>
        These prices are per hour. 1 lesson token is equivalent to a
        1-hour session; session length is customisable, and the tokens
        used scale with it &mdash; for example, a 1.5-hour session uses
        1.5 tokens. For lessons with more than one student, the price
        increases by £7/hour per additional student &mdash; please mention
        this to your tutor when arranging a group session.
      </p>
      <p>
        <strong>Block token discount:</strong> buy 5 or more tokens for
        the same level in a single purchase and receive 10% off, applied
        automatically at checkout. Tokens don&apos;t expire and work with
        any tutor teaching that level.
      </p>
      <p>
        Payment for tokens is taken securely online by card at the time of
        purchase. We don&apos;t take payment by bank transfer or in
        person. Once you&apos;ve agreed a date and time with a tutor, they
        schedule the session on the platform, which reserves the right
        number of tokens for that session and shows it as an upcoming
        session on your dashboard. Your tutor is only paid once the
        session has taken place and they&apos;ve marked it as complete.
      </p>

      <h2>Cancellation policy</h2>
      <p>
        If you need to change or cancel a session that&apos;s been
        scheduled, message your tutor as soon as you can. If it won&apos;t
        be going ahead, your tutor cancels it on the platform and your
        reserved tokens are refunded to your balance automatically. See
        our full{" "}
        <a href="/legal/cancellation-refund-policy">
          Cancellation &amp; Refund Policy
        </a>{" "}
        for how lessons logged in error and no-shows are handled.
      </p>

      <h2>Booking policy</h2>
      <p>
        Lessons must be arranged through Channel Tutoring &mdash; via
        in-platform messaging &mdash; and not directly with the tutor.
        This helps us keep sessions properly logged, paid and insured.
      </p>

      <h2>Complaints policy</h2>
      <p>
        If you have any issues or concerns about a tutor or a session,
        please raise these with Channel Tutoring at{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>{" "}
        rather than directly with the tutor, so we can look into it
        properly.
      </p>

      <h2>Consent and safeguarding</h2>
      <p>
        By agreeing to this form, you consent to tutoring sessions being
        provided by Channel Tutoring for the student(s) registered on your
        account. Responsibility for the safety and supervision of your
        child during sessions remains with the parent or guardian. Channel
        Tutoring accepts no liability for the supervision of children
        during tutoring sessions. See our{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a> for
        how we vet tutors and handle messaging safety.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this agreement or your registration? Email{" "}
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>.
      </p>
    </LegalPage>
  );
}
