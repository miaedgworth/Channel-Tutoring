import { region } from "@/lib/region";

// PLACEHOLDER TEXT — Mia is supplying the real Course Terms & Conditions.
// Replace the content below with hers (and bump COURSE_TERMS_VERSION in
// src/lib/constants.ts) before real families sign this at checkout.
export function CourseTermsContent() {
  return (
    <>
      <p>
        These terms apply to anyone booking a place on a {region.brandName}{" "}
        holiday course. By selecting your day(s) and paying the deposit,
        you&apos;re agreeing to these terms on behalf of the child named on
        your booking, in addition to our general{" "}
        <a href="/legal/terms">Terms &amp; Conditions</a>.
      </p>

      <h2>1. Booking and payment</h2>
      <ul>
        <li>
          A deposit is paid at the time of booking to secure your child&apos;s
          place. The remaining balance is due by the date shown at checkout —
          we&apos;ll email you a link to pay it, and you can also pay early
          at any time from your dashboard.
        </li>
        <li>
          A place is only confirmed once the deposit has been paid.
        </li>
      </ul>

      <h2>2. Cancellations and refunds</h2>
      <p>
        See our{" "}
        <a href="/legal/cancellation-refund-policy">
          Cancellation &amp; Refund Policy
        </a>{" "}
        for how cancellations and refunds are handled for course bookings.
      </p>

      <h2>3. About your child</h2>
      <p>
        Please give us accurate, up-to-date information about your child,
        including any medical conditions, allergies or additional needs, so
        we can support them properly during the course.
      </p>

      <h2>4. Conduct and safeguarding</h2>
      <p>
        Our tutors and staff follow our{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a> at all
        times. We ask that children follow reasonable instructions from
        tutors for their own safety and the smooth running of the course.
      </p>

      <h2>5. Changes to the course</h2>
      <p>
        Occasionally we may need to change a tutor, room or timing. We&apos;ll
        let you know as soon as possible if anything changes about your
        child&apos;s booked day(s).
      </p>

      <h2>6. Contact</h2>
      <p>
        Questions about this booking? Email{" "}
        <a href={`mailto:${region.supportEmail}`}>{region.supportEmail}</a>.
      </p>
    </>
  );
}
