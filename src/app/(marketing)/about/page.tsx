import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Channel Tutoring is a Guernsey-based tutoring service providing high-quality academic support from KS3 through GCSEs, A-Levels and university admissions.",
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
          About Channel Tutoring
        </h1>

        <div className="prose-navy mt-8 space-y-6 text-navy/80">
          <p>
            Channel Tutoring is a Guernsey-based tutoring service dedicated
            to providing high-quality academic support across a wide range
            of subjects and levels. From KS3 through GCSEs, A-Levels, and
            university admissions, we help students build confidence,
            strengthen their understanding, and achieve their academic
            goals.
          </p>
          <p>
            Mia founded Channel Tutoring while studying at Cambridge
            University, inspired by the academic environment around her and
            driven by a deep passion for education. Having personally
            benefited from tutoring on her journey to Cambridge, she
            understands its value firsthand. Her goal is to make
            high-quality tutoring in Guernsey more accessible through
            affordable pricing. Through personalised support, students can
            build confidence and develop a genuine love of learning,
            enabling them to excel academically.
          </p>
          <p>
            She believes education should empower individuals not only to
            succeed in exams, but also to think independently, ask
            questions, and develop skills that last a lifetime. Through
            Channel Tutoring, she aims to create a supportive and inspiring
            environment where students feel motivated, capable, and
            equipped to reach their full potential both inside and outside
            the classroom.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-4">
          <LinkButton href="/find-a-tutor" variant="gold">
            Find a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
