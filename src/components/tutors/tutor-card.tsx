import Link from "next/link";
import { formatCurrencyGBP } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function TutorCard({
  tutor,
}: {
  tutor: {
    slug: string;
    headline: string;
    bio: string;
    photoUrl: string | null;
    subjects: string[];
    levels: string[];
    hourlyRatePence: number;
    ratingAverage: number;
    ratingCount: number;
    user: { name: string };
  };
}) {
  return (
    <Link
      href={`/tutors/${tutor.slug}`}
      className="group block rounded-xl border border-navy/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy text-lg font-bold text-gold overflow-hidden">
          {tutor.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tutor.photoUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            tutor.user.name.charAt(0)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-base font-semibold text-navy group-hover:underline">
            {tutor.user.name}
          </p>
          <p className="text-sm text-navy/60">{tutor.headline}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tutor.levels.map((level) => (
              <Badge key={level} variant="neutral">
                {level === "A_LEVEL" ? "A-Level" : level}
              </Badge>
            ))}
            {tutor.subjects.slice(0, 3).map((subject) => (
              <Badge key={subject} variant="gold">
                {subject}
              </Badge>
            ))}
            {tutor.subjects.length > 3 && (
              <Badge variant="neutral">+{tutor.subjects.length - 3} more</Badge>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm text-navy/60">{tutor.bio}</p>

      <div className="mt-4 flex items-center justify-between border-t border-navy/10 pt-3">
        <div className="flex items-center gap-1 text-sm text-navy/70">
          {tutor.ratingCount > 0 ? (
            <>
              <span aria-hidden className="text-gold-dark">
                ★
              </span>
              <span className="font-medium">{tutor.ratingAverage.toFixed(1)}</span>
              <span className="text-navy/40">({tutor.ratingCount})</span>
            </>
          ) : (
            <span className="text-navy/40">No reviews yet</span>
          )}
        </div>
        <p className="font-heading font-semibold text-navy">
          {formatCurrencyGBP(tutor.hourlyRatePence)}
          <span className="text-xs font-normal text-navy/50">/hr</span>
        </p>
      </div>
    </Link>
  );
}
