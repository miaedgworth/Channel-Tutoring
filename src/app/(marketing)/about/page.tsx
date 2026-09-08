import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { region, REGION } from "@/lib/region";

export const metadata: Metadata = {
  title: "About Us",
  description: `${region.brandName} is a ${region.country}-based tutoring service providing high-quality academic support from KS3 through GCSEs, A-Levels and university admissions.`,
};

export default function AboutPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
          About {region.brandName}
        </h1>

        <div className="prose-navy mt-8 space-y-6 text-navy/80">
          <p>
            {region.brandName} is a {region.country}-based tutoring service
            dedicated to providing high-quality academic support across a
            wide range of subjects and levels. From KS3 through GCSEs,
            A-Levels, and university admissions, we help students build
            confidence, strengthen their understanding, and achieve their
            academic goals.
          </p>
        </div>

        {REGION === "CH" ? (
          <div className="mt-8 rounded-lg border border-amber-600/20 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            This page still has the Channel Tutoring founder story below as a
            placeholder — tell me the real {region.brandName} founding story
            (who founded it, and why) and I&apos;ll replace it.
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-6 sm:flex-row">
          <div className="shrink-0 sm:w-48">
            <div className="relative aspect-[4/5] w-full max-w-[12rem] overflow-hidden rounded-xl bg-navy/5 sm:max-w-none">
              <Image
                src="/founder-photo.png"
                alt={`Mia, Founder of ${region.brandName}`}
                fill
                sizes="192px"
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-sm font-medium text-navy/70">
              Mia &mdash; Founder
            </p>
            <a
              href="https://www.linkedin.com/in/mia-edgworth-491486423"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-navy/60 underline hover:text-navy"
            >
              LinkedIn
            </a>
          </div>

          <div className="prose-navy space-y-6 text-navy/80">
            <p>
              Mia founded {region.brandName} while studying at Cambridge
              University, inspired by the academic environment around her
              and driven by a deep passion for education. Having personally
              benefited from tutoring on her journey to Cambridge, she
              understands its value firsthand. Her goal is to make
              high-quality tutoring in {region.country} more accessible
              through affordable pricing. Through personalised support,
              students can build confidence and develop a genuine love of
              learning, enabling them to excel academically.
            </p>
            <p>
              She believes education should empower individuals not only to
              succeed in exams, but also to think independently, ask
              questions, and develop skills that last a lifetime. Through
              {" "}{region.brandName}, she aims to create a supportive and
              inspiring environment where students feel motivated, capable,
              and equipped to reach their full potential both inside and
              outside the classroom.
            </p>
          </div>
        </div>

        {REGION === "GG" && (
          <div className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-6">
            <h2 className="font-heading text-base font-semibold text-navy">
              Cambridge Changemakers Award
            </h2>
            <p className="mt-2 text-sm text-navy/80">
              In 2026, Mia won the Homerton College Changemakers Catalyst Fund
              Award, an initiative from the University of Cambridge that
              supports student-led ventures creating positive social impact.
              The award recognised {region.brandName}&apos;s work widening
              access to education in {region.country}, and is supporting the
              launch of our university admissions and interview coaching.
              Read more on our{" "}
              <Link
                href="/news/channel-tutoring-wins-cambridge-changemakers-award"
                className="underline"
              >
                News page
              </Link>
              .
            </p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <LinkButton href="/find-a-tutor" variant="gold">
            Find a Tutor
          </LinkButton>
        </div>
      </Container>
    </div>
  );
}
