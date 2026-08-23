import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="21 August 2026">
      <p>
        Channel Tutoring (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
        based in Guernsey and provides an online platform connecting students
        and parents (&ldquo;clients&rdquo;) with tutors. This policy explains
        what personal data we collect, why, and the rights you have over it.
        We process personal data in accordance with the Data Protection
        (Bailiwick of Guernsey) Law, 2017, which reflects the standards of
        UK/EU GDPR.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>Account details: name, email address, phone number, password (stored as a secure hash, never in plain text).</li>
        <li>Tutor application details: subjects, qualifications, experience, DBS check status, and any CV/reference links you provide.</li>
        <li>Booking information: session subject, level, exam board, dates, times and notes you add.</li>
        <li>Payment information: processed securely by Stripe, our payment provider. We do not store full card details on our own servers.</li>
        <li>Messages sent through our in-app messaging system.</li>
        <li>Newsletter preferences, if you opt in to marketing emails.</li>
        <li>Technical data such as IP address and browser information, used for security (e.g. rate-limiting) and essential cookies.</li>
      </ul>

      <h2>How we use your data</h2>
      <ul>
        <li>To create and manage your account and provide the core service (bookings, payments, messaging).</li>
        <li>To process payments and payouts via our payment provider, Stripe.</li>
        <li>To review tutor applications and carry out safeguarding checks.</li>
        <li>To monitor in-app messages for safeguarding purposes, given many of our clients are under 18.</li>
        <li>To send transactional emails (booking confirmations, receipts, password resets).</li>
        <li>To send marketing emails, only if you have opted in, and always with an easy way to unsubscribe.</li>
        <li>To comply with our legal and regulatory obligations.</li>
      </ul>

      <h2>Who we share data with</h2>
      <p>We share limited data with trusted third parties who help us operate the platform:</p>
      <ul>
        <li><strong>Stripe</strong> — for processing payments and tutor payouts.</li>
        <li><strong>Resend</strong> — for sending transactional and marketing emails.</li>
        <li>Our hosting and database providers, who store data securely on our behalf.</li>
      </ul>
      <p>We never sell your personal data.</p>

      <h2>Under-18 users</h2>
      <p>
        Many of our clients book tutoring for children under 18. Accounts are
        created and managed by a parent or guardian. Messaging between
        clients and tutors is monitored by our team to help keep young
        people safe — see our{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a> for
        details.
      </p>

      <h2>How long we keep data</h2>
      <p>
        We keep account and booking data for as long as your account is
        active, and for a reasonable period afterwards to meet legal,
        accounting and safeguarding record-keeping requirements. You can ask
        us to delete your account and associated personal data at any time,
        subject to any records we are legally required to retain.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>The right to access the personal data we hold about you.</li>
        <li>The right to have inaccurate data corrected.</li>
        <li>The right to request deletion of your data (&ldquo;right to be forgotten&rdquo;), subject to legal retention requirements.</li>
        <li>The right to withdraw consent to marketing at any time, via your account settings or the unsubscribe link in any email.</li>
        <li>The right to lodge a complaint with the Office of the Data Protection Authority in Guernsey.</li>
      </ul>
      <p>
        To exercise any of these rights, contact us at{" "}
        <a href="mailto:privacy@channeltutoring.gg">privacy@channeltutoring.gg</a>.
      </p>

      <h2>Cookies</h2>
      <p>
        We use essential cookies to run the platform, and optional analytics
        cookies to help us improve it. See our{" "}
        <a href="/legal/cookie-policy">Cookie Policy</a> for details.
      </p>

      <h2>Contact us</h2>
      <p>
        If you have any questions about this policy or how we handle your
        data, contact us at{" "}
        <a href="mailto:privacy@channeltutoring.gg">privacy@channeltutoring.gg</a>.
      </p>
    </LegalPage>
  );
}
