import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { LEVELS, TUTOR_PAYOUT_PENCE } from "@/lib/constants";
import { formatCurrencyGBP } from "@/lib/utils";
import { requireUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "Tutor Agreement" };
export const dynamic = "force-dynamic";

export default async function TutorAgreementPage() {
  await requireUser("TUTOR");

  return (
    <LegalPage title="Tutor Agreement" lastUpdated="23 August 2026">
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
        <li>You must provide accurate information about your qualifications and experience.</li>
        <li>You are responsible for obtaining your own DBS (criminal record) check where appropriate.</li>
        <li>You must notify us immediately of any safeguarding-relevant matter.</li>
      </ul>

      <h2>3. What you&apos;re paid</h2>
      <p>
        Session prices are fixed by Channel Tutoring according to level and
        are the same for every tutor. You are paid the following per hour,
        with our platform fee deducted automatically at the time of payment:
      </p>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-navy/15">
            <th className="py-2 pr-4 font-semibold text-navy">Level</th>
            <th className="py-2 font-semibold text-navy">You&apos;re paid</th>
          </tr>
        </thead>
        <tbody>
          {LEVELS.map((l) => (
            <tr key={l.value} className="border-b border-navy/10 last:border-0">
              <td className="py-2 pr-4">{l.label}</td>
              <td className="py-2 font-semibold">
                {formatCurrencyGBP(TUTOR_PAYOUT_PENCE[l.value])}/hour
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        This applies however a session is booked, including block bookings
        &mdash; a discount for booking multiple sessions in advance never
        reduces what you&apos;re paid. These rates may be updated from time
        to time, with reasonable notice.
      </p>

      <h2>4. Payments and payouts</h2>
      <ul>
        <li>You must add your UK bank account details in your tutor dashboard to receive payouts.</li>
        <li>You can request a withdrawal of your available balance at any time. Withdrawals are paid by bank transfer every Monday.</li>
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
      <p>
        For online sessions, use{" "}
        <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer">
          Google Meet
        </a>{" "}
        — it&apos;s free, needs no account for the client, and works in any
        browser. Share the meeting link with your client through the
        Channel Tutoring messaging system beforehand.
      </p>

      <h2>7. Profile accuracy</h2>
      <p>
        Your public profile (bio, qualifications, subjects, levels taught)
        must be accurate and kept up to date. We may unpublish or edit a profile
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
        <a href="mailto:info@channeltutoring.com">info@channeltutoring.com</a>.
      </p>
    </LegalPage>
  );
}
