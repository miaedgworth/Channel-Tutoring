import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { CourseInterestForm } from "@/components/marketing/course-interest-form";
import { CourseBookingWizard } from "@/components/marketing/course-booking-wizard";
import { getDaysAvailability } from "@/lib/course-capacity";
import { formatCurrency, formatDate } from "@/lib/utils";
import { region } from "@/lib/region";

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
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { days: { orderBy: { sortOrder: "asc" } } },
  });
  if (!course) notFound();

  const hasPaidDays = course.days.length > 0;
  const [session, availability] = await Promise.all([
    hasPaidDays ? auth() : Promise.resolve(null),
    getDaysAvailability(course.days.map((d) => ({ id: d.id, capacity: d.capacity }))),
  ]);
  const isLoggedInClient = session?.user?.role === "CLIENT";

  return (
    <div className="py-16">
      <Container className="max-w-3xl">
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
          {course.timeLabel && ` · ${course.timeLabel}`}
          {course.venue && ` · ${course.venue}`}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-navy/80">{course.description}</p>

        {course.status === "UPCOMING" && hasPaidDays && (
          <>
            <section className="mt-10">
              <h2 className="font-heading text-lg font-semibold text-navy">
                What to expect
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-navy/70">
                <li className="flex gap-2">
                  <span aria-hidden className="text-gold-dark">
                    &bull;
                  </span>
                  Small-group GCSE revision sessions, run by experienced{" "}
                  {region.brandName} tutors.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-gold-dark">
                    &bull;
                  </span>
                  Focused, exam-board-aware teaching plus structured practice
                  exam questions.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-gold-dark">
                    &bull;
                  </span>
                  A lunch break each day — bring a water bottle and packed
                  lunch or snack.
                </li>
                <li className="flex gap-2">
                  <span aria-hidden className="text-gold-dark">
                    &bull;
                  </span>
                  Choose any single day, or save with the multi-day bundle
                  below.
                </li>
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-heading text-lg font-semibold text-navy">Schedule</h2>
              <div className="mt-3 overflow-x-auto rounded-xl border border-navy/10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy/10 bg-navy/[0.02] text-navy/50">
                      <th className="px-4 py-2.5 font-medium">Day</th>
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="px-4 py-2.5 text-right font-medium">Price</th>
                      <th className="px-4 py-2.5 text-right font-medium">Availability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.days.map((day) => {
                      const a = availability.get(day.id);
                      return (
                        <tr key={day.id} className="border-b border-navy/5 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-navy">{day.label}</td>
                          <td className="px-4 py-2.5 text-navy/60">{formatDate(day.date)}</td>
                          <td className="px-4 py-2.5 text-right text-navy/70">
                            {formatCurrency(day.pricePence)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {a?.soldOut ? (
                              <span className="text-xs font-semibold uppercase tracking-wide text-navy/40">
                                Sold out
                              </span>
                            ) : a?.spotsLeft != null && a.spotsLeft <= 3 ? (
                              <span className="text-xs font-semibold text-red">
                                {a.spotsLeft === 1 ? "1 spot left" : `${a.spotsLeft} spots left`}
                              </span>
                            ) : (
                              <span className="text-xs text-navy/40">Available</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {course.bundleLabel && course.bundlePricePence != null && (
                <p className="mt-3 text-sm text-navy/70">
                  <span className="font-semibold text-navy">{course.bundleLabel}:</span>{" "}
                  {formatCurrency(course.bundlePricePence)} — a saving over booking those days
                  individually.
                </p>
              )}
            </section>

            <section className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-heading text-lg font-semibold text-navy">Book your place</h2>
              <p className="mt-1 text-sm text-navy/60">
                Pay a{" "}
                {course.depositPercent ?? 25}% deposit to secure your child&apos;s place today.
                The remaining balance is due{" "}
                {course.balanceDueDate ? formatDate(course.balanceDueDate) : "later"}.
              </p>
              <div className="mt-5">
                <CourseBookingWizard
                  courseTitle={course.title}
                  courseSlug={course.slug}
                  days={course.days.map((d) => ({
                    id: d.id,
                    date: d.date.toISOString(),
                    label: d.label,
                    track: d.track,
                    pricePence: d.pricePence,
                    soldOut: availability.get(d.id)?.soldOut ?? false,
                    spotsLeft: availability.get(d.id)?.spotsLeft ?? null,
                  }))}
                  bundlePricePence={course.bundlePricePence}
                  bundleLabel={course.bundleLabel}
                  depositPercent={course.depositPercent}
                  balanceDueDate={course.balanceDueDate?.toISOString() ?? null}
                  isLoggedInClient={isLoggedInClient}
                />
              </div>
            </section>
          </>
        )}

        {course.status === "UPCOMING" && !hasPaidDays && (
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
