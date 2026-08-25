import Link from "next/link";
import { formatLevel } from "@/lib/utils";
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
                {formatLevel(level)}
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
    </Link>
  );
}
