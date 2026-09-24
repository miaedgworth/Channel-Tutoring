function TargetIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function CapIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <path d="M12 5 2 9.5 12 14l10-4.5L12 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 11.8V16c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M15.2 19c.2-2.3 1.6-4 3.3-4.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none">
      <rect x="4" y="3.5" width="16" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 9l1.5 1.5 3-3M7.5 15.5l1.5 1.5 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 9h3M13.5 15.5h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const POINTS = [
  {
    Icon: TargetIcon,
    title: "Exam-style practice",
    body: "Students work through exam-style questions all day, uncovering gaps and learning how marks are actually awarded.",
  },
  {
    Icon: CapIcon,
    title: "Subject specialists",
    body: "Every session is led by a subject specialist who supports your child at every step, whatever grade they're aiming for.",
  },
  {
    Icon: GroupIcon,
    title: "Deliberately small groups",
    body: "Groups are kept small, so every student gets individual attention and the chance to ask questions.",
  },
  {
    Icon: ChecklistIcon,
    title: "Know exactly what to revise",
    body: "They leave knowing what to revise, how to revise it, and how to tackle the paper on the day.",
  },
];

export function CourseWhyItWorks() {
  return (
    <section className="bg-navy/[0.03] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-heading text-2xl font-bold text-navy">Why it works</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-xl border border-navy/10 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Icon />
              </div>
              <h3 className="mt-3 font-heading text-base font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm text-navy/70">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
