import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Registration and Agreement Form",
  description:
    "The pricing, cancellation, booking and safeguarding terms every client agrees to when registering with Channel Tutoring.",
};

export default function RegistrationAgreementPage() {
  return (
    <LegalPage title="Registration and Agreement Form" lastUpdated="23 August 2026">
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
        These prices are based on one-to-one lessons. For lessons with more
        than one student, the price increases by £7/hour per additional
        student &mdash; please mention this to us when booking a group
        session so we can arrange it.
      </p>
      <p>
        <strong>Block booking discount:</strong> book and pay for 5 or more
        sessions with the same tutor in advance and receive 10% off. This
        is applied automatically at checkout when you select 5 or more
        available times for the same subject and level.
      </p>
      <p>
        Payment is taken securely online by card at the time of booking. We
        don&apos;t take payment by bank transfer or in person.
      </p>

      <h2>Cancellation policy</h2>
      <p>
        If you need to cancel a session, please give as much notice as
        possible.
      </p>
      <ul>
        <li>
          <strong>24 hours&apos; notice or more:</strong> free cancellation,
          with a full refund.
        </li>
        <li>
          <strong>Less than 24 hours&apos; notice:</strong> 50% of the
          lesson fee remains payable; the other 50% is refunded.
        </li>
      </ul>
      <p>
        See our full{" "}
        <a href="/legal/cancellation-refund-policy">
          Cancellation &amp; Refund Policy
        </a>{" "}
        for how tutor-initiated cancellations and no-shows are handled.
      </p>

      <h2>Booking policy</h2>
      <p>
        Lessons must be arranged through Channel Tutoring &mdash; via the
        booking system and in-platform messaging &mdash; and not directly
        with the tutor. This helps us keep sessions properly scheduled,
        paid and insured.
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
