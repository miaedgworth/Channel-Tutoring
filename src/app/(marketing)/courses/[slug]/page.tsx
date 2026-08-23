import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { CourseInterestForm } from "@/components/marketing/course-interest-form";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function dateRange(startDate: Date | null, endDate: Date | null) {
  if (!startDate) return "Dates to be confirmed";
  if (!endDate || endDate.getTime() === startDate.getTime()) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return {};
  return {
    title: course.title,
    description: course.description.slice(0, 160),
  };
}

export default async function CourseDetailPage({
  params,
}: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) notFound();

  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">
            {course.title}
          </h1>
          <Badge variant={course.status === "UPCOMING" ? "success" : "neutral"}>
            {course.status === "UPCOMING" ? "Upcoming" : "Past"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-navy/50">
          {dateRange(course.startDate, course.endDate)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-navy/80">{course.description}</p>

        {course.status === "UPCOMING" && (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Express your interest
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              Leave your details and we&apos;ll be in touch as soon as
              booking opens for this course.
            </p>
            <div className="mt-5">
              <CourseInterestForm courseId={course.id} />
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
