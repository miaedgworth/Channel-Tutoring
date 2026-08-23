import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { CourseForm } from "@/components/admin/course-form";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Course" };
export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: PageProps<"/admin/courses/[id]">) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: { interests: { orderBy: { createdAt: "desc" } } },
  });
  if (!course) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <Card>
        <CardContent>
          <CourseForm
            course={{
              id: course.id,
              title: course.title,
              description: course.description,
              status: course.status,
              startDate: course.startDate?.toISOString() ?? null,
              endDate: course.endDate?.toISOString() ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Expressed interest ({course.interests.length})
            </h2>
            {course.interests.length > 0 && (
              <a
                href={`/api/admin/export/course-interest/${course.id}`}
                className="text-sm font-medium text-navy underline"
              >
                Export CSV
              </a>
            )}
          </div>

          {course.interests.length === 0 ? (
            <p className="mt-3 text-sm text-navy/60">
              No one has expressed interest in this course yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-navy/10 text-navy/50">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Phone</th>
                    <th className="pb-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {course.interests.map((i) => (
                    <tr key={i.id} className="border-b border-navy/5">
                      <td className="py-2 pr-4 font-medium text-navy">{i.name}</td>
                      <td className="py-2 pr-4 text-navy/70">{i.email}</td>
                      <td className="py-2 pr-4 text-navy/70">{i.phone ?? "—"}</td>
                      <td className="py-2 text-navy/50">{formatDateTime(i.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
