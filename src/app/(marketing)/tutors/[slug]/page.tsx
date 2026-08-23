import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatCurrencyGBP, formatDate, formatLevel } from "@/lib/utils";
import { DBS_STATUS_LABELS, LEVEL_PRICE_PENCE } from "@/lib/constants";

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
              {tutor.dbsStatus === "VERIFIED" && (
                <Badge variant="success">DBS Verified</Badge>
              )}
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

          <div className="shrink-0 rounded-xl border border-navy/10 bg-white p-5 text-center shadow-sm">
            <ul className="space-y-1 text-left text-sm">
              {tutor.levels.map((l) => (
                <li key={l} className="flex items-center justify-between gap-4">
                  <span className="text-navy/60">{formatLevel(l)}</span>
                  <span className="font-semibold text-navy">
                    {formatCurrencyGBP(LEVEL_PRICE_PENCE[l] ?? 0)}/hr
                  </span>
                </li>
              ))}
            </ul>
            <LinkButton
              href={`/tutors/${tutor.slug}/book`}
              variant="gold"
              className="mt-3 w-full"
            >
              Book a Lesson
            </LinkButton>
            <Link
              href={`/dashboard/messages?tutor=${tutor.slug}`}
              className="mt-2 block text-sm font-medium text-navy underline"
            >
              Message this tutor
            </Link>
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
                At a glance
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-navy/50">Experience</dt>
                  <dd className="font-medium text-navy">
                    {tutor.yearsExperience} years
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-navy/50">DBS status</dt>
                  <dd className="font-medium text-navy">
                    {DBS_STATUS_LABELS[tutor.dbsStatus]}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
