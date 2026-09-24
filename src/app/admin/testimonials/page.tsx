import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { TestimonialsManager } from "@/components/admin/testimonials-manager";

export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const [testimonials, courses] = await Promise.all([
    prisma.courseTestimonial.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.course.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">Testimonials</h2>
        <p className="mt-1 text-sm text-navy/60">
          Quotes shown on course pages, e.g. &ldquo;See what our students said
          about our summer course&rdquo;. Only add real feedback from actual
          students or parents.
        </p>
        <div className="mt-5">
          <TestimonialsManager
            testimonials={testimonials.map((t) => ({
              id: t.id,
              studentName: t.studentName,
              quote: t.quote,
              rating: t.rating,
              courseId: t.courseId,
              createdAt: t.createdAt.toISOString(),
            }))}
            courses={courses}
          />
        </div>
      </CardContent>
    </Card>
  );
}
