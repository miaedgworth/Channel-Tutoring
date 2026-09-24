import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseForm } from "@/components/admin/course-form";
import { CourseDaysEditor } from "@/components/admin/course-days-editor";
import { MarkCourseBalancePaidButton } from "@/components/admin/mark-course-balance-paid-button";
import { getDaysSpotsTaken } from "@/lib/course-capacity";
import { formatDateTime, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Course" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, "success" | "warning" | "neutral"> = {
  AWAITING_DEPOSIT: "warning",
  DEPOSIT_PAID: "warning",
  PAID_IN_FULL: "success",
  CANCELLED: "neutral",
};

export default async function EditCoursePage({
  params,
}: PageProps<"/admin/courses/[id]">) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      interests: { orderBy: { createdAt: "desc" } },
      days: { orderBy: { sortOrder: "asc" } },
      enrollments: {
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true, email: true } },
          days: { include: { day: true }, orderBy: { day: { sortOrder: "asc" } } },
        },
      },
    },
  });
  if (!course) notFound();

  const spotsTakenByDay = await getDaysSpotsTaken(course.days.map((d) => d.id));

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
              venue: course.venue,
              timeLabel: course.timeLabel,
              bundlePricePence: course.bundlePricePence,
              bundleLabel: course.bundleLabel,
              depositPercent: course.depositPercent,
              balanceDueDate: course.balanceDueDate?.toISOString() ?? null,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Course days ({course.days.length})
          </h2>
          <p className="mt-1 text-sm text-navy/60">
            Add a day for each bookable subject/date. Set the bundle price
            and label above once days are added.
          </p>
          <div className="mt-4">
            <CourseDaysEditor
              courseId={course.id}
              days={course.days.map((d) => ({
                id: d.id,
                date: d.date.toISOString(),
                label: d.label,
                track: d.track,
                pricePence: d.pricePence,
                sortOrder: d.sortOrder,
                capacity: d.capacity,
                spotsTaken: spotsTakenByDay.get(d.id) ?? 0,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Bookings ({course.enrollments.length})
            </h2>
            {course.enrollments.length > 0 && (
              <a
                href={`/api/admin/export/course-enrollments/${course.id}`}
                className="text-sm font-medium text-navy underline"
              >
                Export CSV
              </a>
            )}
          </div>

          {course.enrollments.length === 0 ? (
            <p className="mt-3 text-sm text-navy/60">No one has booked yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {course.enrollments.map((e) => (
                <div key={e.id} className="rounded-lg border border-navy/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-navy">
                        {e.childName} <span className="text-navy/40">— {e.client.name}</span>
                      </p>
                      <p className="text-xs text-navy/50">
                        {e.client.email} &middot; {e.days.map((d) => d.day.label).join(", ")}
                      </p>
                    </div>
                    <Badge variant={STATUS_BADGE[e.status] ?? "neutral"}>{e.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-navy/70">
                      Total {formatCurrency(e.totalPence)} &middot; Deposit{" "}
                      {formatCurrency(e.depositPence)} ({e.depositStatus.toLowerCase()}) &middot; Balance{" "}
                      {formatCurrency(e.balancePence)} ({e.balanceStatus.toLowerCase()})
                    </p>
                    {e.depositStatus === "PAID" && e.balanceStatus === "PENDING" && (
                      <MarkCourseBalancePaidButton enrollmentId={e.id} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
