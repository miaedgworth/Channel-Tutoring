import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { CourseFullDetail } from "@/components/marketing/course-full-detail";

export const dynamic = "force-dynamic";

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
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { days: { orderBy: { sortOrder: "asc" } } },
  });
  if (!course) notFound();

  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <CourseFullDetail course={course} />
      </Container>
    </div>
  );
}
