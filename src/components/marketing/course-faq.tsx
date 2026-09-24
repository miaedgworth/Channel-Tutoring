import { formatDate } from "@/lib/utils";

export function CourseFaq({
  depositPercent,
  balanceDueDate,
}: {
  depositPercent: number;
  balanceDueDate: Date | null;
}) {
  const items = [
    {
      q: "Who is this course for?",
      a: "Year 11 students preparing for their mocks or GCSE exams — whether they're aiming to secure a pass or push for the top grades, sessions are led by a specialist who supports them at every step.",
    },
    {
      q: "How big are the groups?",
      a: "Groups are kept deliberately small, so every student gets individual attention and the chance to ask the questions they might not ask in a full classroom.",
    },
    {
      q: "What should my child bring?",
      a: "Revision materials or notes, stationery, and a water bottle and packed lunch or snack for each day.",
    },
    {
      q: "How does the deposit and balance work?",
      a: `A ${depositPercent}% deposit secures your child's place at checkout. The remaining balance is due${balanceDueDate ? ` by ${formatDate(balanceDueDate)}` : ""} — we'll email a payment link, and you can also pay early from your dashboard.`,
      link: { href: "/legal/cancellation-refund-policy", label: "Read the full Cancellation & Refund Policy" },
    },
    {
      q: "What if my child needs a different subject?",
      a: "Book the single day for whichever subject they need the biggest boost in — Foundation or Higher Maths, Biology, Chemistry or Physics.",
    },
  ];

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-bold text-navy">
          Frequently asked questions
        </h2>
        <div className="mt-8 divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
          {items.map((item) => (
            <details key={item.q} className="group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-heading text-base font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark">
                {item.q}
                <span aria-hidden className="shrink-0 text-gold-dark transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2.5 text-sm text-navy/70">
                {item.a}{" "}
                {item.link && (
                  <a href={item.link.href} className="underline">
                    {item.link.label}
                  </a>
                )}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
