import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { TutorCard } from "@/components/tutors/tutor-card";
import { region, REGION } from "@/lib/region";
import { formatCurrency, formatDateRange } from "@/lib/utils";

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
  // This award was specifically won by Channel Tutoring in Guernsey — don't
  // reuse it for Nines Tutoring, that would be a false claim. Swap in a
  // real Swiss trust point once Mia has one.
  ...(REGION === "GG"
    ? [
        {
          title: "Supported by the University of Cambridge",
          body: "Backed by the Homerton College Changemakers Catalyst Fund Award, recognising our work widening access to education in Guernsey.",
        },
      ]
    : []),
];

const STEPS = [
  { step: "1", title: "Find a tutor", body: "Search by subject, level, exam board and price." },
  { step: "2", title: "Message and schedule", body: "Agree a time with your tutor, then confirm the lesson using credit." },
  { step: "3", title: "Start learning", body: "Message your tutor and track every session in your dashboard." },
];

export default async function HomePage() {
  const [featuredTutors, featuredCourse] = await Promise.all([
    prisma.tutorProfile.findMany({
      where: { isPublished: true },
      orderBy: { ratingAverage: "desc" },
      take: 3,
      include: { user: { select: { name: true } } },
    }),
    prisma.course.findFirst({
      where: { status: "UPCOMING", days: { some: {} } },
      orderBy: { startDate: "asc" },
      include: { days: { orderBy: { pricePence: "asc" }, take: 1 } },
    }),
  ]);
  const cheapestDayPrice = featuredCourse?.days[0]?.pricePence;

  return (
    <div>
      <section className="border-b border-navy/10 bg-gradient-to-b from-navy/[0.03] to-white py-20">
        <Container className="text-center">
          <h1 className="mx-auto max-w-3xl font-heading text-4xl font-bold leading-tight text-navy sm:text-5xl">
            Unlock Your Potential with {region.brandName}
          </h1>
          <div className="relative mx-auto mt-8 aspect-[3/2] w-full max-w-2xl overflow-hidden rounded-2xl shadow-md">
            <Image
              src="/home-hero.webp"
              alt={`A ${region.brandName} tutor working through a session with a student`}
              fill
              priority
              sizes="(min-width: 672px) 672px, 100vw"
              className="object-cover"
            />
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-navy/70">
            {region.brandName} connects students and parents online or in
            person in {region.country} with high-quality tutors. Build
            confidence through tailored support.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <LinkButton href="/about" variant="gold" size="lg">
              About Us
            </LinkButton>
          </div>
        </Container>
      </section>

      {featuredCourse && (
        <section className="border-b border-navy/10 bg-gold/10 py-12">
          <Container>
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-gold-dark/30 bg-white p-6 shadow-sm sm:flex-row sm:justify-between sm:p-8">
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
                  Now open for booking
                </p>
                <h2 className="mt-1 font-heading text-xl font-bold text-navy sm:text-2xl">
                  {featuredCourse.title}
                </h2>
                <p className="mt-1.5 text-sm font-semibold text-navy/80">
                  Boost your child&apos;s confidence and grades ahead of their GCSEs.
                </p>
                <p className="mt-1 text-sm text-navy/60">
                  {formatDateRange(featuredCourse.startDate, featuredCourse.endDate)}
                  {featuredCourse.venue && ` · ${featuredCourse.venue}`}
                  {cheapestDayPrice != null && ` · from ${formatCurrency(cheapestDayPrice)}/day`}
                </p>
              </div>
              <LinkButton href="/courses" variant="gold" size="lg" className="shrink-0">
                View &amp; Book
              </LinkButton>
            </div>
          </Container>
        </section>
      )}

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
