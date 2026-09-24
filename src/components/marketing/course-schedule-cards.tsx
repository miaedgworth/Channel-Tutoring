import type { CourseDayTrack } from "@prisma/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { DayAvailability } from "@/lib/course-capacity";

export interface ScheduleDay {
  id: string;
  date: Date;
  label: string;
  track: CourseDayTrack;
  pricePence: number;
}

function AvailabilityBadge({ availability }: { availability: DayAvailability | undefined }) {
  if (availability?.soldOut) {
    return (
      <span className="inline-flex items-center rounded-full bg-navy/10 px-2.5 py-0.5 text-xs font-semibold text-navy/60">
        Full
      </span>
    );
  }
  if (availability?.spotsLeft != null && availability.spotsLeft <= 3) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
        Few left
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
      Available
    </span>
  );
}

export function CourseScheduleCards({
  days,
  availability,
}: {
  days: ScheduleDay[];
  availability: Map<string, DayAvailability>;
}) {
  return (
    <section id="schedule" className="scroll-mt-20 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-bold text-navy">Schedule</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {days.map((day) => (
            <div
              key={day.id}
              className="flex flex-col rounded-xl border border-navy/10 bg-white p-4 text-center shadow-sm"
            >
              {day.track === "MATHS" && (
                <span className="mx-auto mb-2 inline-flex items-center rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gold-dark">
                  Tier option
                </span>
              )}
              <p className="font-heading text-sm font-semibold text-navy">{day.label}</p>
              <p className="mt-1 text-xs text-navy/50">{formatDate(day.date)}</p>
              <p className="mt-3 font-heading text-xl font-bold text-navy">
                {formatCurrency(day.pricePence)}
              </p>
              <div className="mt-3">
                <AvailabilityBadge availability={availability.get(day.id)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
