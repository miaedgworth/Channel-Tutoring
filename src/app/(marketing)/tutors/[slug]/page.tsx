import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate, formatLevel } from "@/lib/utils";
import { AVAILABILITY_PERIOD_LABELS, SESSION_MODE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/tutors/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await prisma.tutorProfile.findUnique({
    where: { slug },
    include: { user: { select: { name: true } } },
  });
  if (!tutor) return {};
  return {
    title: `${tutor.user.name} — ${tutor.headline}`,
    description: tutor.bio.slice(0, 160),
  };
}

export default async function TutorProfilePage({
  params,
}: PageProps<"/tutors/[slug]">) {
  const { slug } = await params;
  const tutor = await prisma.tutorProfile.findUnique({
    where: { slug, isPublished: true },
    include: {
      user: { select: { name: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { client: { select: { name: true } } },
      },
    },
  });

  if (!tutor) notFound();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const periodOrder: Record<string, number> = { MORNING: 0, AFTERNOON: 1, EVENING: 2 };
  const availability = (
    await prisma.tutorAvailabilitySlot.findMany({
      where: { tutorId: tutor.id, date: { gte: today } },
      orderBy: { date: "asc" },
      take: 20,
    })
  ).sort((a, b) => a.date.getTime() - b.date.getTime() || periodOrder[a.period] - periodOrder[b.period]);

  return (
    <div className="py-12">
      <Container className="max-w-4xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy text-3xl font-bold text-gold">
            {tutor.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tutor.photoUrl}
                alt={tutor.user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              tutor.user.name.charAt(0)
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-2xl font-bold text-navy sm:text-3xl">
              {tutor.user.name}
            </h1>
            <p className="mt-1 text-navy/70">{tutor.headline}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {tutor.ratingCount > 0 ? (
                <span className="flex items-center gap-1 text-sm text-navy/70">
                  <span aria-hidden className="text-gold-dark">★</span>
                  <span className="font-semibold">{tutor.ratingAverage.toFixed(1)}</span>
                  <span className="text-navy/40">({tutor.ratingCount} reviews)</span>
                </span>
              ) : (
                <span className="text-sm text-navy/40">No reviews yet</span>
              )}
              <Badge variant="neutral">{SESSION_MODE_LABELS[tutor.sessionMode]}</Badge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.levels.map((l) => (
                <Badge key={l} variant="neutral">{formatLevel(l)}</Badge>
              ))}
              {tutor.subjects.map((s) => (
                <Badge key={s} variant="gold">{s}</Badge>
              ))}
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border border-navy/10 bg-white p-5 text-center shadow-sm sm:w-64">
            <LinkButton
              href={`/dashboard/messages?tutor=${tutor.slug}`}
              variant="gold"
              className="w-full"
            >
              Message this tutor
            </LinkButton>
            <p className="mt-2 text-xs text-navy/50">
              Buy lesson tokens for your level, then message{" "}
              {tutor.user.name.split(" ")[0]} to arrange a time.
              Pricing is fixed by level — the same for every tutor. See our{" "}
              <a href="/pricing" className="underline">
                Pricing page
              </a>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          <div className="sm:col-span-2 space-y-8">
            <section>
              <h2 className="font-heading text-lg font-semibold text-navy">About</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">
                {tutor.bio}
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-navy">
                Qualifications
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy/80">
                {tutor.qualifications}
              </p>
            </section>

            <section>
              <h2 className="font-heading text-lg font-semibold text-navy">
                Reviews
              </h2>
              {tutor.reviews.length === 0 ? (
                <p className="mt-2 text-sm text-navy/50">
                  No reviews yet — be the first to book and review this
                  tutor.
                </p>
              ) : (
                <ul className="mt-3 space-y-4">
                  {tutor.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-lg border border-navy/10 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-navy">
                          {review.client.name}
                        </p>
                        <span className="text-xs text-navy/40">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 text-gold-dark" aria-label={`${review.rating} out of 5 stars`}>
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-sm text-navy/70">{review.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-navy/10 bg-navy/[0.02] p-5">
              <h3 className="font-heading text-sm font-semibold text-navy">
                General availability
              </h3>
              {availability.length === 0 ? (
                <p className="mt-2 text-sm text-navy/50">
                  No availability listed right now — message {tutor.user.name.split(" ")[0]} to
                  ask about upcoming slots.
                </p>
              ) : (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {availability.map((slot) => (
                    <li key={slot.id} className="flex justify-between text-navy/80">
                      <span>{formatDate(slot.date)}</span>
                      <span className="font-medium text-navy">
                        {AVAILABILITY_PERIOD_LABELS[slot.period]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-navy/40">
                These are general windows, not exact times — message the
                tutor to agree what works for you both.
              </p>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
