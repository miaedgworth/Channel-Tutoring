import { region } from "@/lib/region";

// Sourced from the "Parent/Guardian Consent and Student Information Form"
// for the GCSE October Half Term Revision Course. Adapted to the site's
// second-person voice and to a single online e-signature (typed name +
// checkbox) in place of the paper form's separate parent/student
// signature boxes.
export function CourseTermsContent() {
  return (
    <>
      <p>
        These terms apply to a booking on a {region.brandName} half term
        revision course. By selecting your day(s), paying the deposit and
        signing below, you&apos;re agreeing to these terms on behalf of the
        student named on your booking, in addition to our general{" "}
        <a href="/legal/terms">Terms &amp; Conditions</a>.
      </p>

      <h2>1. Booking and payment</h2>
      <ul>
        <li>
          Places are limited and reserved on receipt of the deposit paid at
          booking. A booking is only confirmed once the deposit has been
          paid.
        </li>
        <li>
          The remaining balance is due by the date shown at checkout —
          we&apos;ll email you a link to pay it, and you can also pay early
          at any time from your dashboard.
        </li>
      </ul>

      <h2>2. Cancellations and refunds</h2>
      <p>
        See our{" "}
        <a href="/legal/cancellation-refund-policy">
          Cancellation &amp; Refund Policy
        </a>
        . In short: fees already paid (deposit or balance) are
        non-refundable, except where we cancel a session or where required
        by law. If we&apos;re unable to run a session for reasons within our
        control, we&apos;ll offer a full refund or a transfer to an
        alternative date.
      </p>

      <h2>3. About your child</h2>
      <p>
        Please give us complete, accurate and up-to-date information about
        the student, including any medical conditions, allergies,
        disabilities, learning needs, medication or dietary requirements
        staff should be aware of, and how they&apos;ll leave at the end of
        each day.
      </p>

      <h2>4. Emergency medical consent</h2>
      <p>
        In the event of illness or injury where you can&apos;t be contacted
        promptly, you authorise course staff to obtain appropriate medical
        advice or emergency treatment for the student where considered
        necessary. Every reasonable effort will be made to contact you
        before any significant medical decision is taken.
      </p>

      <h2>5. The programme</h2>
      <p>
        The course consists of supervised educational sessions — GCSE
        revision lessons, small-group teaching, independent study, lunch
        breaks, educational workshops and practice examinations. It does
        not include hazardous activities or overnight accommodation.
        Please make sure the student brings revision materials/notes,
        stationery, and a water bottle and snack or packed lunch each day.
      </p>

      <h2>6. Attendance, arrival and departure</h2>
      <p>
        Students should arrive no earlier than 8:50am and be collected
        promptly at the end of the day unless otherwise agreed — please let
        us know in advance if collection arrangements change where
        reasonably possible. Staff supervise students only during
        scheduled programme hours (not including the lunch break) and
        authorised activities; you remain responsible for the student
        outside these times, including travel to and from the venue.
      </p>

      <h2>7. Behaviour expectations</h2>
      <p>
        Students are expected to treat staff and fellow students with
        respect, follow staff instructions, attend lessons punctually,
        behave in a manner appropriate to a learning environment, refrain
        from bullying, harassment or discrimination, and not possess or use
        alcohol, illegal drugs, vaping products or tobacco during the
        programme. Mobile phones should be kept on silent during lessons
        unless a tutor authorises their use for educational purposes.
      </p>
      <p>
        Serious or repeated misconduct may result in the student being
        removed from the programme; where appropriate, you&apos;ll be
        contacted before any decision is made. Persistent disruption may
        result in you being asked to collect the student before the end of
        the day.
      </p>

      <h2>8. Photography and media</h2>
      <p>
        At booking you&apos;ll be asked to choose whether photos or videos
        of the student may be used for promotional purposes, for internal
        records only, or not at all — we&apos;ll follow whichever option
        you select.
      </p>

      <h2>9. Personal property</h2>
      <p>
        Students are responsible for their own personal belongings. We
        can&apos;t accept responsibility for lost or damaged property
        except where caused by our negligence.
      </p>

      <h2>10. Data protection</h2>
      <p>
        We collect and process personal information solely to administer
        the programme, safeguard students, respond to emergencies and
        comply with legal obligations. Information is handled
        confidentially and in accordance with {region.dataProtectionLine}.
      </p>

      <h2>11. Safeguarding</h2>
      <p>
        We&apos;re committed to providing a safe and supportive learning
        environment. All tutors and staff working directly with students
        hold a {region.criminalRecordCheckLabel} (or equivalent where
        applicable), and appropriate safeguarding procedures are followed
        throughout the programme. See our{" "}
        <a href="/legal/safeguarding-policy">Safeguarding Policy</a>.
      </p>

      <h2>12. Risk acknowledgement</h2>
      <p>
        Participation carries the ordinary risks associated with attending
        classes and travelling to and from the venue. Nothing in these
        terms excludes or limits any liability that cannot lawfully be
        excluded.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about this booking? Email{" "}
        <a href={`mailto:${region.supportEmail}`}>{region.supportEmail}</a>.
      </p>
    </>
  );
}
