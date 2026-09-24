import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayCourseBalanceButton } from "@/components/dashboard/pay-course-balance-button";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "My Courses" };
export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "neutral" }> = {
  AWAITING_DEPOSIT: { label: "Awaiting deposit", variant: "warning" },
  DEPOSIT_PAID: { label: "Deposit paid — balance due", variant: "warning" },
  PAID_IN_FULL: { label: "Paid in full", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export default async function MyCoursesPage({
  searchParams,
}: PageProps<"/dashboard/courses">) {
  const user = await requireUser("CLIENT");
  const search = await searchParams;

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      course: true,
      days: { include: { day: true }, orderBy: { day: { sortOrder: "asc" } } },
    },
  });

  return (
    <div className="space-y-6">
      {search.checkout === "success" && (
        <div className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Payment received — this will update shortly.
        </div>
      )}

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">My Courses</h2>
          {enrollments.length === 0 ? (
            <p className="mt-3 text-sm text-navy/50">
              You haven&apos;t booked a place on a course yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {enrollments.map((enrollment) => {
                const badge = STATUS_BADGE[enrollment.status] ?? STATUS_BADGE.AWAITING_DEPOSIT!;
                return (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-navy/10 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-heading font-semibold text-navy">
                          {enrollment.course.title}
                        </p>
                        <p className="text-sm text-navy/60">
                          {enrollment.childName} —{" "}
                          {enrollment.days.map((d) => d.day.label).join(", ")}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                      <p className="text-navy/70">
                        Total <span className="font-medium text-navy">{formatCurrency(enrollment.totalPence)}</span>
                      </p>
                      <p className="text-navy/70">
                        Deposit{" "}
                        <span className="font-medium text-navy">
                          {formatCurrency(enrollment.depositPence)}
                        </span>{" "}
                        {enrollment.depositStatus === "PAID" ? "paid" : "due"}
                      </p>
                      <p className="text-navy/70">
                        Balance{" "}
                        <span className="font-medium text-navy">
                          {formatCurrency(enrollment.balancePence)}
                        </span>{" "}
                        {enrollment.balanceStatus === "PAID"
                          ? "paid"
                          : enrollment.course.balanceDueDate
                            ? `due ${formatDate(enrollment.course.balanceDueDate)}`
                            : "due later"}
                      </p>
                    </div>

                    {enrollment.depositStatus === "PAID" && enrollment.balanceStatus === "PENDING" && (
                      <div className="mt-4">
                        <PayCourseBalanceButton
                          enrollmentId={enrollment.id}
                          balancePence={enrollment.balancePence}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
