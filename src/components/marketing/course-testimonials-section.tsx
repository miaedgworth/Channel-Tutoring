import { REGION } from "@/lib/region";

interface Testimonial {
  id: string;
  studentName: string;
  role: string | null;
  subject: string | null;
  quote: string;
  rating: number | null;
}

function QuoteMark() {
  return (
    <svg aria-hidden viewBox="0 0 32 24" className="h-8 w-8 text-gold">
      <path
        fill="currentColor"
        d="M0 24V14.4C0 6.4 4.8 1.2 12.8 0l1.6 4.4C9.2 5.6 6.8 8.4 6.8 12.4H12.8V24H0ZM17.6 24V14.4c0-8 4.8-13.2 12.8-14.4l1.6 4.4c-5.2 1.2-7.6 4-7.6 8H32V24H17.6Z"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div aria-hidden className="mt-2 flex gap-0.5 text-gold-dark">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "" : "text-navy/15"}>
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex min-w-[82%] shrink-0 snap-center flex-col rounded-xl bg-white p-6 shadow-sm sm:min-w-0 sm:shrink">
      <QuoteMark />
      <p className="mt-3 flex-1 font-heading text-base italic leading-relaxed text-navy">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      {testimonial.rating != null && <Stars rating={testimonial.rating} />}
      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-navy">
        {testimonial.studentName}
      </p>
      {(testimonial.role || testimonial.subject) && (
        <p className="text-xs text-navy/50">
          {[testimonial.role, testimonial.subject].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
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
    <section className="bg-navy py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-bold text-white">{heading}</h2>

        <div
          role="region"
          aria-label="Testimonials"
          tabIndex={0}
          className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0"
        >
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-xl space-y-1.5 text-center text-sm text-white/70">
          {REGION === "GG" && (
            <p>
              Backed by the University of Cambridge Homerton College Changemakers Catalyst Fund
              Award.
            </p>
          )}
          <p>Subject-specialist tutors, reviewed before they go live.</p>
        </div>
      </div>
    </section>
  );
}
