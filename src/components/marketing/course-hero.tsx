import { formatCurrency, formatDateRange } from "@/lib/utils";

function CalendarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none">
      <rect x="2.5" y="4" width="15" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6v4l2.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none">
      <path
        d="M10 18s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function CourseHero({
  title,
  startDate,
  endDate,
  timeLabel,
  venue,
  fromPricePence,
}: {
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  timeLabel: string | null;
  venue: string | null;
  fromPricePence: number | null;
}) {
  return (
    <section className="relative overflow-hidden bg-navy py-16 sm:py-20">
      <svg
        aria-hidden
        viewBox="0 0 800 600"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        preserveAspectRatio="xMidYMid slice"
      >
        <circle cx="120" cy="80" r="220" stroke="#C9A227" strokeWidth="2" fill="none" />
        <circle cx="700" cy="520" r="260" stroke="#C9A227" strokeWidth="2" fill="none" />
        <path d="M0 500 Q 400 380 800 520" stroke="#C9A227" strokeWidth="2" fill="none" />
      </svg>

      <div className="relative mx-auto w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy-dark">
          Now open for booking · Places strictly limited
        </span>

        <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-white sm:text-4xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
          Small-group Year 11 revision days at Elizabeth College to lift grades and rebuild
          confidence before the mocks.
        </p>

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/90">
          <li className="flex items-center gap-1.5">
            <CalendarIcon />
            {formatDateRange(startDate, endDate)}
          </li>
          {timeLabel && (
            <li className="flex items-center gap-1.5">
              <ClockIcon />
              {timeLabel}
            </li>
          )}
          {venue && (
            <li className="flex items-center gap-1.5">
              <PinIcon />
              {venue}
            </li>
          )}
        </ul>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#booking"
            className="inline-flex items-center justify-center rounded-md bg-gold px-6 py-3 text-sm font-semibold text-navy-dark transition-colors hover:bg-gold-dark hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            Book a place{fromPricePence != null ? ` – from ${formatCurrency(fromPricePence)}/day` : ""}
          </a>
          <a
            href="#schedule"
            className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
          >
            See the schedule
          </a>
        </div>
      </div>
    </section>
  );
}
