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
    "Search vetted GCSE and A-Level tutors in Guernsey by subject, level, exam board and price.",
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
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Every tutor on Channel Tutoring is vetted, DBS-checked and
            reviewed before their profile goes live.
          </p>
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
  const params = await searchParams;
  const subject = typeof params.subject === "string" ? params.subject : undefined;
  const level = typeof params.level === "string" ? params.level : undefined;
  const examBoard = typeof params.examBoard === "string" ? params.examBoard : undefined;
  const maxPrice = typeof params.maxPrice === "string" ? Number(params.maxPrice) : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "rating";

  const where: Prisma.TutorProfileWhereInput = {
    isPublished: true,
    ...(subject ? { subjects: { has: subject } } : {}),
    ...(level ? { levels: { has: level as "GCSE" | "A_LEVEL" } } : {}),
    ...(examBoard ? { examBoards: { has: examBoard } } : {}),
    ...(maxPrice && !Number.isNaN(maxPrice) ? { hourlyRatePence: { lte: maxPrice * 100 } } : {}),
  };

  const orderBy: Prisma.TutorProfileOrderByWithRelationInput =
    sort === "price-asc"
      ? { hourlyRatePence: "asc" }
      : sort === "price-desc"
        ? { hourlyRatePence: "desc" }
        : { ratingAverage: "desc" };

  const tutors = await prisma.tutorProfile.findMany({
    where,
    orderBy,
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
