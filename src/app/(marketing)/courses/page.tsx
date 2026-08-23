import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Holiday courses and summer schools from Channel Tutoring, in Guernsey.",
};
export const dynamic = "force-dynamic";

function dateRange(startDate: Date | null, endDate: Date | null) {
  if (!startDate) return "Dates to be confirmed";
  if (!endDate || endDate.getTime() === startDate.getTime()) {
    return formatDate(startDate);
  }
  return `${formatDate(startDate)} – ${formatDate(endDate)}`;
}

export default async function CoursesPage() {
  const [upcoming, past] = await Promise.all([
    prisma.course.findMany({
      where: { status: "UPCOMING" },
      orderBy: { startDate: "asc" },
    }),
    prisma.course.findMany({
      where: { status: "PAST" },
      orderBy: { startDate: "desc" },
    }),
  ]);

  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Courses
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Holiday courses and summer schools alongside our regular
            one-to-one tutoring.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-navy">Upcoming</h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">
              No upcoming courses announced right now — check back soon.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {upcoming.map((course) => (
                <Card key={course.id}>
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-base font-semibold text-navy">
                          {course.title}
                        </p>
                        <Badge variant="success">Upcoming</Badge>
                      </div>
                      <p className="mt-1 text-sm text-navy/50">
                        {dateRange(course.startDate, course.endDate)}
                      </p>
                      <p className="mt-2 text-sm text-navy/70">{course.description}</p>
                    </div>
                    <LinkButton
                      href={`/courses/${course.slug}`}
                      variant="gold"
                      size="sm"
                      className="shrink-0"
                    >
                      Express Interest
                    </LinkButton>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-navy">Past Courses</h2>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">No past courses yet.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {past.map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <Card className="transition-colors hover:border-navy/30">
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <p className="font-heading text-base font-semibold text-navy">
                          {course.title}
                        </p>
                        <Badge variant="neutral">Past</Badge>
                      </div>
                      <p className="mt-1 text-sm text-navy/50">
                        {dateRange(course.startDate, course.endDate)}
                      </p>
                      <p className="mt-2 text-sm text-navy/70">{course.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}
