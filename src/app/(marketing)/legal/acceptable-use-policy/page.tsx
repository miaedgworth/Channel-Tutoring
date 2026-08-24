import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Acceptable Use Policy" };

export default function AcceptableUsePolicyPage() {
  return (
    <LegalPage title="Acceptable Use Policy" lastUpdated="21 August 2026">
      <p>
        This policy sets out what we expect from everyone using Channel
        Tutoring — clients, students and tutors alike — to keep the
        platform safe, respectful and trustworthy.
      </p>

      <h2>You must not:</h2>
      <ul>
        <li>Share personal contact details (phone number, personal email, social media handles) with another user, or ask another user for theirs.</li>
        <li>Attempt to arrange tutoring sessions, payment, or communication outside the Channel Tutoring platform.</li>
        <li>Use abusive, threatening, discriminatory or sexually inappropriate language or behaviour towards any other user.</li>
        <li>Impersonate another person, or provide false information about your identity or qualifications.</li>
        <li>Attempt to access another user&apos;s account, or any part of the platform you&apos;re not authorised to use.</li>
        <li>Use the platform for any unlawful purpose.</li>
        <li>Attempt to circumvent our safeguarding measures, including message monitoring.</li>
        <li>Upload or share content that is offensive, illegal, or infringes someone else&apos;s rights.</li>
      </ul>

      <h2>Why we monitor messages</h2>
      <p>
        Given many of our clients are under 18, we automatically screen
        in-app messages for personal contact details and off-platform
        contact requests, and our team can review any conversation for
        safeguarding purposes. This is explained further in our{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a>.
      </p>

      <h2>Consequences of breaching this policy</h2>
      <p>
        We may issue a warning, suspend, or permanently remove any account
        that breaches this policy, and in serious cases may report conduct
        to the relevant authorities. Decisions are made at our discretion,
        with safeguarding as our first priority.
      </p>

      <h2>Reporting a problem</h2>
      <p>
        If you experience or witness a breach of this policy, please
        contact us at{" "}
        <a href="mailto:info@channeltutoring.com">
          info@channeltutoring.com
        </a>
        .
      </p>
    </LegalPage>
  );
}
