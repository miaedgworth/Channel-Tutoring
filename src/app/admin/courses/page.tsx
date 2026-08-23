import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Courses" };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { interests: true } } },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <LinkButton href="/admin/courses/new" variant="gold" size="sm">
          New Course
        </LinkButton>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">No courses yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/admin/courses/${course.id}`}>
              <Card className="transition-colors hover:border-navy/30">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-navy">{course.title}</p>
                      <Badge variant={course.status === "UPCOMING" ? "success" : "neutral"}>
                        {course.status === "UPCOMING" ? "Upcoming" : "Past"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-navy/50">
                      {course._count.interests} interested
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-navy/40">
                    {formatDate(course.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
