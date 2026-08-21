import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Channel Tutoring is a Guernsey-based tutoring company connecting students and parents with vetted GCSE and A-Level tutors.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
          About Channel Tutoring
        </h1>

        <div className="prose-navy mt-8 space-y-6 text-navy/80">
          <p>
            Channel Tutoring was founded to make it simple and safe for
            Guernsey families to find brilliant, trustworthy GCSE and
            A-Level tutors — and just as simple for great tutors to find
            students, without the admin headache.
          </p>
          <p>
            As a small island community, word of mouth has always mattered
            here. We built Channel Tutoring to keep that personal, local
            feel while adding the things a good tutoring platform should
            offer: proper vetting, DBS checks, secure online payments, and
            oversight that protects both students and tutors.
          </p>
          <p>
            Every tutor on our platform goes through an application and
            approval process before their profile goes live. We take
            safeguarding seriously, especially given the number of our
            students who are under 18 — messaging is monitored, personal
            contact details stay off the platform, and every booking is
            recorded.
          </p>
          <p>
            Whether you&apos;re a parent looking for extra support before
            exams, a student wanting to build confidence in a tricky
            subject, or an experienced tutor looking for a better way to
            manage your bookings and payments, we&apos;d love to have you
            on Channel Tutoring.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <LinkButton href="/find-a-tutor" variant="gold">
            Find a Tutor
          </LinkButton>
          <LinkButton href="/join-as-a-tutor" variant="outline">
            Become a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
