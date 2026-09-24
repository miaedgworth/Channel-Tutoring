import { formatCurrency, formatDate } from "@/lib/utils";

function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-dark" fill="none">
      <path d="M4 10.5 8 14l8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CoursePricingCards({
  singleDayPricePence,
  bundlePricePence,
  subjectsIncluded,
  mathsTierOption,
  savingsPence,
  depositPercent,
  balanceDueDate,
}: {
  singleDayPricePence: number;
  bundlePricePence: number | null;
  subjectsIncluded: string[];
  mathsTierOption: string | null;
  savingsPence: number;
  depositPercent: number;
  balanceDueDate: Date | null;
}) {
  const depositNote = `${depositPercent}% deposit secures the place · balance due ${
    balanceDueDate ? formatDate(balanceDueDate) : "later"
  }`;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-bold text-navy">
          Choose what suits your child
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
            <h3 className="font-heading text-lg font-semibold text-navy">Single day</h3>
            <p className="mt-2 font-heading text-3xl font-bold text-navy">
              {formatCurrency(singleDayPricePence)}
            </p>
            <p className="mt-1 text-sm text-navy/50">per day</p>
            <p className="mt-4 text-sm text-navy/70">
              Pick the subject where your child needs the biggest boost.
            </p>
            <a
              href="#booking"
              className="mt-6 inline-flex w-full items-center justify-center rounded-md border border-navy px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-navy hover:text-white"
            >
              Book a day
            </a>
            <p className="mt-3 text-xs text-navy/50">{depositNote}</p>
          </div>

          {bundlePricePence != null && (
            <div className="relative rounded-2xl border-2 border-navy bg-white p-6 shadow-md sm:p-8">
              <span className="absolute -top-3 left-6 inline-flex items-center rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy-dark shadow-sm">
                Best value — 4 days for the price of 3
              </span>
              <h3 className="mt-1.5 font-heading text-lg font-semibold text-navy">
                Full Science &amp; Maths package
              </h3>
              <p className="mt-2 font-heading text-3xl font-bold text-navy">
                {formatCurrency(bundlePricePence)}
              </p>
              {savingsPence > 0 && (
                <p className="mt-1 text-sm font-semibold text-gold-dark">
                  Save {formatCurrency(savingsPence)}
                </p>
              )}
              <ul className="mt-4 space-y-1.5 text-sm text-navy/80">
                {subjectsIncluded.map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <CheckIcon />
                    {s}
                  </li>
                ))}
                {mathsTierOption && (
                  <li className="flex items-center gap-2">
                    <CheckIcon />
                    {mathsTierOption}
                  </li>
                )}
              </ul>
              <a
                href="#booking"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-navy px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-light"
              >
                Book the package
              </a>
              <p className="mt-3 text-xs text-navy/50">{depositNote}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
