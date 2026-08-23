import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { BookingForm } from "@/components/tutors/booking-form";

export const metadata: Metadata = { title: "Book a Lesson" };
export const dynamic = "force-dynamic";

export default async function BookTutorPage({
  params,
}: PageProps<"/tutors/[slug]/book">) {
  const { slug } = await params;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/tutors/${slug}/book`);
  }
  if (session.user.role !== "CLIENT") {
    redirect(`/tutors/${slug}`);
  }

  const tutor = await prisma.tutorProfile.findUnique({
    where: { slug, isPublished: true },
    include: { user: { select: { name: true } } },
  });
  if (!tutor) notFound();

  const slots = await prisma.tutorAvailabilitySlot.findMany({
    where: { tutorId: tutor.id, isBooked: false, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 30,
  });

  return (
    <div className="py-12">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">
          Book {tutor.user.name}
        </h1>
        <p className="mt-1 text-navy/60">{tutor.headline}</p>

        <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
          <BookingForm
            tutorSlug={tutor.slug}
            tutorSubjects={tutor.subjects}
            tutorLevels={tutor.levels}
            tutorExamBoards={tutor.examBoards}
            hourlyRatePence={tutor.hourlyRatePence}
            slots={slots.map((s) => ({
              id: s.id,
              startsAt: s.startsAt.toISOString(),
              endsAt: s.endsAt.toISOString(),
            }))}
          />
        </div>
      </Container>
    </div>
  );
}
