import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { FeedbackForm } from "@/components/marketing/feedback-form";

export const metadata: Metadata = {
  title: "Feedback",
  description: "Tell us how your tutoring sessions went with Channel Tutoring.",
};

export default function FeedbackPage() {
  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Share Your Feedback
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-navy/70">
            We&apos;d love to hear how your sessions have gone. Your feedback
            helps us support our tutors and improve the platform.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
          <FeedbackForm />
        </div>
      </Container>
    </div>
  );
}
