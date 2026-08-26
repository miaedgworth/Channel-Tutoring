import { Suspense } from "react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { TutorFilters } from "@/components/tutors/tutor-filters";
import { TutorCard } from "@/components/tutors/tutor-card";

export const metadata: Metadata = {
  title: "Find a Tutor",
  description:
    "Search vetted tutors in Guernsey by subject and level, from KS3 through to university admissions.",
};
export const dynamic = "force-dynamic";

export default function FindATutorPage({
  searchParams,
}: PageProps<"/find-a-tutor">) {
  return (
    <div className="py-12">
      <Container>
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Find a Tutor
          </h1>
        </div>

        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-gold/30 bg-gold/5 px-5 py-4 text-center text-sm text-navy">
          We&apos;re currently updating our roster of tutors. In the
          meantime, email{" "}
          <a href="mailto:info@channeltutoring.com" className="underline">
            info@channeltutoring.com
          </a>{" "}
          to make an enquiry and we&apos;ll help you find the right tutor.
        </div>

        <div className="mt-8">
          <Suspense fallback={null}>
            <TutorFilters />
          </Suspense>
        </div>

        <div className="mt-8">
          <Suspense fallback={<p className="text-center text-navy/50">Loading tutors...</p>}>
            <TutorResults searchParams={searchParams} />
          </Suspense>
        </div>
      </Container>
    </div>
  );
}

async function TutorResults({
  searchParams,
}: {
  searchParams: PageProps<"/find-a-tutor">["searchParams"];
}) {
  const VALID_LEVELS = ["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"] as const;

  const params = await searchParams;
  const subject = typeof params.subject === "string" ? params.subject : undefined;
  const rawLevel = typeof params.level === "string" ? params.level : undefined;
  const level = VALID_LEVELS.includes(rawLevel as (typeof VALID_LEVELS)[number])
    ? (rawLevel as (typeof VALID_LEVELS)[number])
    : undefined;
  const sessionMode = typeof params.sessionMode === "string" ? params.sessionMode : undefined;

  const where: Prisma.TutorProfileWhereInput = {
    isPublished: true,
    ...(subject ? { subjects: { has: subject } } : {}),
    ...(level ? { levels: { has: level } } : {}),
    ...(sessionMode === "ONLINE"
      ? { sessionMode: { in: ["ONLINE", "BOTH"] } }
      : sessionMode === "IN_PERSON"
        ? { sessionMode: { in: ["IN_PERSON", "BOTH"] } }
        : {}),
  };

  const tutors = await prisma.tutorProfile.findMany({
    where,
    orderBy: { ratingAverage: "desc" },
    include: { user: { select: { name: true } } },
  });

  if (tutors.length === 0) {
    return (
      <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-10 text-center">
        <p className="text-navy/60">
          No tutors match your filters right now. Try broadening your
          search.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-navy/50">
        {tutors.length} tutor{tutors.length === 1 ? "" : "s"} found
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    </div>
  );
}
