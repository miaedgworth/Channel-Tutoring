import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Safeguarding Policy" };

export default function SafeguardingPolicyPage() {
  return (
    <LegalPage title="Safeguarding Policy" lastUpdated="21 August 2026">
      <p>
        Many of the students using Channel Tutoring are under 18. Keeping
        them safe is one of our most important responsibilities, and this
        policy explains what we do to make that happen.
      </p>

      <h2>Tutor vetting</h2>
      <ul>
        <li>Every tutor completes an application detailing their qualifications, experience and DBS (criminal record) check status.</li>
        <li>Our team reviews every application before approving a tutor account.</li>
        <li>A tutor&apos;s public profile cannot go live until their DBS check status is verified by our team.</li>
        <li>We may request updated DBS information periodically, and can suspend a tutor&apos;s account at any time if concerns arise.</li>
      </ul>

      <h2>Monitored communication</h2>
      <ul>
        <li>All messaging between clients and tutors happens within the Channel Tutoring platform.</li>
        <li>Messages are automatically screened for personal contact details (phone numbers, emails, social media handles) or requests to communicate off-platform, and flagged for our team to review.</li>
        <li>Our team can view any conversation on the platform for safeguarding oversight.</li>
        <li>Tutors and clients should never exchange personal contact details or arrange to communicate outside the platform.</li>
      </ul>

      <h2>Booking and audit trail</h2>
      <p>
        Every booking, message and account action is recorded and
        time-stamped, giving us a full audit trail if we ever need to
        investigate a concern.
      </p>

      <h2>Parental oversight</h2>
      <p>
        Accounts for under-18 students are created and managed by a parent
        or guardian, who can see all bookings, messages and payment history
        for their account.
      </p>

      <h2>Reporting a concern</h2>
      <p>
        If you have a safeguarding concern about a tutor, a client, or
        anything you&apos;ve seen on the platform, please contact us
        immediately at{" "}
        <a href="mailto:safeguarding@channeltutoring.gg">
          safeguarding@channeltutoring.gg
        </a>
        . We take every report seriously and will investigate promptly,
        which may include suspending an account while we look into it.
      </p>

      <h2>Related policies</h2>
      <p>
        This policy should be read alongside our{" "}
        <a href="/legal/acceptable-use-policy">Acceptable Use Policy</a> and{" "}
        <a href="/legal/privacy-policy">Privacy Policy</a>.
      </p>
    </LegalPage>
  );
}
