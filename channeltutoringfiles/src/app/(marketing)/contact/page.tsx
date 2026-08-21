import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/marketing/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Channel Tutoring team.",
};

export default function ContactPage() {
  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
            Get in Touch
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-navy/70">
            Questions about booking a tutor, becoming a tutor, or anything
            else? We&apos;re happy to help.
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-6 shadow-sm sm:p-8">
          <ContactForm />
        </div>

        <p className="mt-8 text-center text-sm text-navy/50">
          You can also email us directly at{" "}
          <a href="mailto:hello@channeltutoring.gg" className="underline">
            hello@channeltutoring.gg
          </a>
        </p>
      </Container>
    </div>
  );
}
