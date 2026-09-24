import type { Course, CourseDay } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CourseInterestForm } from "@/components/marketing/course-interest-form";
import { CourseBookingWizard } from "@/components/marketing/course-booking-wizard";
import { CourseTestimonialsSection } from "@/components/marketing/course-testimonials-section";
import { getDaysAvailability } from "@/lib/course-capacity";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils";

// The full course page content — everything a visitor sees once they land
// on a course, whether that's its own /courses/[slug] page or embedded
// directly on the /courses listing page. Kept as one component so both
// places always show exactly the same thing.
export async function CourseFullDetail({ course }: { course: Course & { days: CourseDay[] } }) {
  const hasPaidDays = course.days.length > 0;
  const [session, availability, summerCourseTestimonials] = await Promise.all([
    hasPaidDays ? auth() : Promise.resolve(null),
    getDaysAvailability(course.days.map((d) => ({ id: d.id, capacity: d.capacity }))),
    hasPaidDays
      ? prisma.courseTestimonial.findMany({
          where: { course: { slug: "summer-school-2026" } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);
  const isLoggedInClient = session?.user?.role === "CLIENT";

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">
          {course.title}
        </h1>
        <Badge variant={course.status === "UPCOMING" ? "success" : "neutral"}>
          {course.status === "UPCOMING" ? "Upcoming" : "Past"}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-navy/50">
        {formatDateRange(course.startDate, course.endDate)}
        {course.timeLabel && ` · ${course.timeLabel}`}
        {course.venue && ` · ${course.venue}`}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-navy/80">{course.description}</p>

      {course.status === "UPCOMING" && hasPaidDays && (
        <>
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
          </section>

          <CourseTestimonialsSection
            heading="See what our students said about our summer course"
            testimonials={summerCourseTestimonials.map((t) => ({
              id: t.id,
              studentName: t.studentName,
              quote: t.quote,
              rating: t.rating,
            }))}
          />

          <section className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-navy">Book your place</h2>
            <p className="mt-1 text-sm text-navy/60">
              Pay a {course.depositPercent ?? 25}% deposit to secure your child&apos;s place
              today. The remaining balance is due{" "}
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
          <h2 className="font-heading text-lg font-semibold text-navy">Express your interest</h2>
          <p className="mt-1 text-sm text-navy/60">
            Leave your details and we&apos;ll be in touch as soon as booking opens for this
            course.
          </p>
          <div className="mt-5">
            <CourseInterestForm courseId={course.id} />
          </div>
        </div>
      )}
    </div>
  );
}
