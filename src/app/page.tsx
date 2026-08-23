import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { TutorCard } from "@/components/tutors/tutor-card";
import { SUBJECTS } from "@/lib/constants";

export const dynamic = "force-dynamic";

const TRUST_POINTS = [
  { title: "DBS-checked tutors", body: "Every tutor is vetted and DBS-checked before their profile goes live." },
  { title: "Guernsey-based", body: "Local knowledge of GCSE and A-Level exam boards used across the island." },
  { title: "Secure payments", body: "Pay securely online — no cash, no awkward conversations." },
  { title: "Monitored messaging", body: "All communication happens on-platform, with safeguarding oversight." },
];

const STEPS = [
  { step: "1", title: "Find a tutor", body: "Search by subject, level, exam board and price." },
  { step: "2", title: "Book a lesson", body: "Pick a time that works and pay securely online." },
  { step: "3", title: "Start learning", body: "Message your tutor and track every session in your dashboard." },
];

const TESTIMONIALS = [
  {
    quote:
      "Our daughter's confidence in Maths has completely turned around this year. Booking and paying online was so simple.",
    name: "Parent of a Year 11 student",
  },
  {
    quote:
      "I like that I can message my tutor directly and see all my past sessions in one place. Makes revising for exams much less stressful.",
    name: "A-Level Chemistry student",
  },
  {
    quote:
      "As a tutor, having bookings, payments and messaging handled for me means I can just focus on teaching.",
    name: "Channel Tutoring tutor",
  },
];

export default async function HomePage() {
  const featuredTutors = await prisma.tutorProfile.findMany({
    where: { isPublished: true },
    orderBy: { ratingAverage: "desc" },
    take: 3,
    include: { user: { select: { name: true } } },
  });

  return (
    <div>
      <section className="border-b border-navy/10 bg-gradient-to-b from-navy/[0.03] to-white py-20">
        <Container className="text-center">
          <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Trusted GCSE &amp; A-Level tutoring, right here in Guernsey
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-navy/70">
            Channel Tutoring connects students and parents with vetted,
            experienced tutors — with simple online booking, secure payments
            and safeguarding built in.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/find-a-tutor" variant="gold" size="lg">
              Find a Tutor
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="rounded-xl border border-navy/10 p-5">
                <h3 className="font-heading text-base font-semibold text-navy">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm text-navy/60">{point.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy/[0.02] py-16">
        <Container>
          <h2 className="text-center font-heading text-2xl font-bold text-navy sm:text-3xl">
            Subjects we cover
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-navy/60">
            GCSE and A-Level tuition across the core subjects, taught by
            tutors who know the exam boards used in Guernsey.
          </p>
          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-2">
            {SUBJECTS.map((subject) => (
              <Link
                key={subject}
                href={`/find-a-tutor?subject=${encodeURIComponent(subject)}`}
                className="rounded-full border border-navy/15 bg-white px-4 py-1.5 text-sm font-medium text-navy/80 transition-colors hover:border-gold-dark hover:text-navy"
              >
                {subject}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="text-center font-heading text-2xl font-bold text-navy sm:text-3xl">
            How it works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy font-heading text-lg font-bold text-gold">
                  {s.step}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-navy/60">{s.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <LinkButton href="/how-it-works" variant="outline">
              Learn more about how it works
            </LinkButton>
          </div>
        </Container>
      </section>

      {featuredTutors.length > 0 && (
        <section className="bg-navy/[0.02] py-16">
          <Container>
            <h2 className="text-center font-heading text-2xl font-bold text-navy sm:text-3xl">
              Meet some of our tutors
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <LinkButton href="/find-a-tutor" variant="gold">
                Browse all tutors
              </LinkButton>
            </div>
          </Container>
        </section>
      )}

      <section className="py-16">
        <Container>
          <h2 className="text-center font-heading text-2xl font-bold text-navy sm:text-3xl">
            What families and tutors say
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-xl border border-navy/10 bg-white p-6">
                <blockquote className="text-sm leading-relaxed text-navy/80">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs font-semibold text-navy/50">
                  {t.name}
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      <section className="bg-navy py-16">
        <Container className="text-center">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">
            Whether you&apos;re looking for a tutor or want to join our
            network, we&apos;d love to hear from you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/find-a-tutor" variant="gold" size="lg">
              Find a Tutor
            </LinkButton>
            <LinkButton href="/contact" variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-navy">
              Contact Us
            </LinkButton>
          </div>
        </Container>
      </section>
    </div>
  );
}
