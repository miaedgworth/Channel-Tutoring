import { Container } from "@/components/ui/container";
import { TutorCard } from "@/components/tutors/tutor-card";

interface CourseTutor {
  slug: string;
  headline: string;
  bio: string;
  photoUrl: string | null;
  subjects: string[];
  levels: string[];
  ratingAverage: number;
  ratingCount: number;
  user: { name: string };
}

export function CourseTutorsSection({ tutors }: { tutors: CourseTutor[] }) {
  if (tutors.length === 0) return null;

  return (
    <section className="bg-navy/[0.02] py-12 sm:py-16">
      <Container className="max-w-3xl">
        <h2 className="text-center font-heading text-2xl font-bold text-navy">
          {tutors.length === 1 ? "Meet your tutor" : "Meet your tutors"}
        </h2>
        <div
          className={`mt-8 grid gap-5 ${tutors.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-md"}`}
        >
          {tutors.map((tutor) => (
            <TutorCard key={tutor.slug} tutor={tutor} />
          ))}
        </div>
      </Container>
    </section>
  );
}
