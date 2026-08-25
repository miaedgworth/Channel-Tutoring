import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { TutorCard } from "@/components/tutors/tutor-card";

export const dynamic = "force-dynamic";

const TRUST_POINTS = [
  {
    title: "High-Quality Tutors Who Are Experts in Their Subjects",
    body: "Every tutor is a subject specialist, reviewed by our team before their profile goes live.",
  },
  {
    title: "Tailored Learning Plans",
    body: "Sessions built around your child's specific goals, exam board and pace.",
  },
  {
    title: "Affordable Pricing",
    body: "Fixed, transparent pricing by level, with no hidden fees.",
  },
  {
    title: "Building Confidence and Academic Excellence",
    body: "We focus on genuine understanding, not just short-term results.",
  },
  {
    title: "Face-to-face and Remote Learning Available",
    body: "Choose whichever format suits your family, in person or online.",
  },
  {
    title: "Supported by the University of Cambridge",
    body: "Backed by the Homerton College Changemakers Catalyst Fund Award, recognising our work widening access to education in Guernsey.",
  },
];

const STEPS = [
  { step: "1", title: "Find a tutor", body: "Search by subject, level, exam board and price." },
  { step: "2", title: "Message and schedule", body: "Agree a time with your tutor, then confirm the lesson using credit." },
  { step: "3", title: "Start learning", body: "Message your tutor and track every session in your dashboard." },
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
            Unlock Your Potential with Channel Tutoring
          </h1>
          <div className="relative mx-auto mt-8 aspect-[3/2] w-full max-w-2xl overflow-hidden rounded-2xl shadow-md">
            <Image
              src="/home-hero.webp"
              alt="A Channel Tutoring tutor working through a session with a student"
              fill
              priority
              sizes="(min-width: 672px) 672px, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-navy/70">
            Channel Tutoring connects students and parents online or in
            person in Guernsey with high-quality tutors. Build confidence
            through tailored support.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/about" variant="gold" size="lg">
              About Us
            </LinkButton>
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        <Container className="text-center">
          <LinkButton href="/find-a-tutor" variant="gold" size="lg">
            Find a Tutor
          </LinkButton>
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
