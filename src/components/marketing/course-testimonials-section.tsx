interface Testimonial {
  id: string;
  studentName: string;
  quote: string;
  rating: number | null;
}

export function CourseTestimonialsSection({
  heading,
  testimonials,
}: {
  heading: string;
  testimonials: Testimonial[];
}) {
  if (testimonials.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="font-heading text-lg font-semibold text-navy">{heading}</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {testimonials.map((t) => (
          <div key={t.id} className="rounded-xl border border-navy/10 bg-white p-5 shadow-sm">
            {t.rating != null && (
              <p aria-hidden className="text-gold-dark">
                {"★".repeat(t.rating)}
                {"☆".repeat(Math.max(0, 5 - t.rating))}
              </p>
            )}
            <p className="mt-2 text-sm italic text-navy/80">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-3 text-sm font-semibold text-navy">{t.studentName}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
