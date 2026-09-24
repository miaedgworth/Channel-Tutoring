import type { Course, CourseDay } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { CourseInterestForm } from "@/components/marketing/course-interest-form";
import { CourseBookingWizard } from "@/components/marketing/course-booking-wizard";
import { CourseTestimonialsSection } from "@/components/marketing/course-testimonials-section";
import { CourseHero } from "@/components/marketing/course-hero";
import { CourseWhyItWorks } from "@/components/marketing/course-why-it-works";
import { CoursePricingCards } from "@/components/marketing/course-pricing-cards";
import { CourseScheduleCards } from "@/components/marketing/course-schedule-cards";
import { CourseFaq } from "@/components/marketing/course-faq";
import { CourseStickyCta } from "@/components/marketing/course-sticky-cta";
import { getDaysAvailability } from "@/lib/course-capacity";
import { computeCoursePrice } from "@/lib/course-pricing";
import { formatDate, formatDateRange } from "@/lib/utils";
import { DEFAULT_COURSE_DEPOSIT_PERCENT } from "@/lib/constants";

// The full course page content — everything a visitor sees once they land
// on a course, whether that's its own /courses/[slug] page or embedded
// directly on the /courses listing page. Kept as one component so both
// places always show exactly the same thing.
export async function CourseFullDetail({ course }: { course: Course & { days: CourseDay[] } }) {
  const hasPaidDays = course.days.length > 0;
  const isUpcomingPaidCourse = course.status === "UPCOMING" && hasPaidDays;

  const [session, availability, summerCourseTestimonials, tutorCount] = await Promise.all([
    hasPaidDays ? auth() : Promise.resolve(null),
    getDaysAvailability(course.days.map((d) => ({ id: d.id, capacity: d.capacity }))),
    isUpcomingPaidCourse
      ? prisma.courseTestimonial.findMany({
          where: { course: { slug: "summer-school-2026" }, featured: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    isUpcomingPaidCourse
      ? prisma.tutorProfile.count({ where: { isPublished: true } })
      : Promise.resolve(0),
  ]);
  const isLoggedInClient = session?.user?.role === "CLIENT";

  // Server-side warning (not a build failure) so a PLACEHOLDER quote never
  // silently ships unnoticed — visible in runtime logs; also flagged in
  // the admin testimonials list itself.
  for (const t of summerCourseTestimonials) {
    if (t.quote.startsWith("PLACEHOLDER")) {
      console.warn(
        `[course-testimonials] Featured testimonial "${t.id}" is still a PLACEHOLDER — replace it at /admin/testimonials before this is seen by real visitors.`,
      );
    }
  }

  if (!isUpcomingPaidCourse) {
    return (
      <Container className="max-w-3xl py-16">
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

        {course.status === "UPCOMING" && !hasPaidDays && (
          <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-lg font-semibold text-navy">
              Express your interest
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              Leave your details and we&apos;ll be in touch as soon as booking opens for this
              course.
            </p>
            <div className="mt-5">
              <CourseInterestForm courseId={course.id} />
            </div>
          </div>
        )}
      </Container>
    );
  }

  // Everything below is pure presentation — the actual price/availability
  // numbers all come from the same computeCoursePrice/getDaysAvailability
  // helpers the checkout itself uses, never recomputed independently.
  const sortedDays = [...course.days].sort((a, b) => a.sortOrder - b.sortOrder);
  const singleDayPricePence = Math.min(...sortedDays.map((d) => d.pricePence));
  const scienceDays = sortedDays.filter((d) => d.track === "SCIENCE");
  const mathsDays = sortedDays.filter((d) => d.track === "MATHS");
  const bundleSelection = mathsDays[0]
    ? [...scienceDays.map((d) => d.id), mathsDays[0].id]
    : scienceDays.map((d) => d.id);
  const { totalPence: bundleTotalPence } = computeCoursePrice(course, bundleSelection);
  const individualSumPence = bundleSelection.reduce((sum, id) => {
    const day = sortedDays.find((d) => d.id === id);
    return day ? sum + day.pricePence : sum;
  }, 0);
  const savingsPence = individualSumPence - bundleTotalPence;
  const mathsTierOption =
    mathsDays.length > 0
      ? `Maths (${mathsDays.map((d) => d.label.replace(/\s*Maths$/i, "")).join(" or ")})`
      : null;
  const depositPercent = course.depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;

  return (
    <>
      <CourseHero
        title={course.title}
        startDate={course.startDate}
        endDate={course.endDate}
        timeLabel={course.timeLabel}
        venue={course.venue}
        fromPricePence={singleDayPricePence}
      />
      <CourseStickyCta fromPricePence={singleDayPricePence} />

      <Container className="max-w-3xl py-10">
        <p className="whitespace-pre-wrap text-navy/80">{course.description}</p>
      </Container>

      <CourseWhyItWorks />

      <CoursePricingCards
        singleDayPricePence={singleDayPricePence}
        bundlePricePence={course.bundlePricePence}
        subjectsIncluded={scienceDays.map((d) => d.label)}
        mathsTierOption={mathsTierOption}
        savingsPence={savingsPence}
        depositPercent={depositPercent}
        balanceDueDate={course.balanceDueDate}
      />

      <CourseScheduleCards
        days={sortedDays.map((d) => ({
          id: d.id,
          date: d.date,
          label: d.label,
          track: d.track,
          pricePence: d.pricePence,
        }))}
        availability={availability}
      />

      <CourseTestimonialsSection
        heading="See what our students said about our summer course"
        testimonials={summerCourseTestimonials.map((t) => ({
          id: t.id,
          studentName: t.studentName,
          role: t.role,
          subject: t.subject,
          quote: t.quote,
          rating: t.rating,
        }))}
        tutorCount={tutorCount}
      />

      <CourseFaq depositPercent={depositPercent} balanceDueDate={course.balanceDueDate} />

      <section id="booking" className="scroll-mt-20 bg-navy py-12 sm:py-16">
        <Container className="max-w-3xl">
          <div className="rounded-2xl bg-navy-light/40 p-4 sm:p-6">
            <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
              Secure your child&apos;s place
            </h2>
            <p className="mt-1.5 text-sm text-white/70">
              Pay a {depositPercent}% deposit today. The remaining balance is due{" "}
              {course.balanceDueDate ? formatDate(course.balanceDueDate) : "later"}.
            </p>
            <div className="mt-5 rounded-xl bg-white p-5 shadow-lg sm:p-6">
              <CourseBookingWizard
                courseSlug={course.slug}
                days={sortedDays.map((d) => ({
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
          </div>
        </Container>
      </section>
    </>
  );
}
