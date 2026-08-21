import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Channel Tutoring.",
};

const FAQS = [
  {
    q: "How are tutors vetted?",
    a: "Every tutor completes an application covering their qualifications, experience and DBS (criminal record) check status. Our team reviews each application, and a tutor's profile only goes live once we've verified their DBS check.",
  },
  {
    q: "Is it safe for my child to message a tutor directly?",
    a: "Yes. All messaging happens within Channel Tutoring, not over personal phone numbers or social media. Messages are monitored, and anything that looks like an attempt to move communication off-platform is flagged for our team to review.",
  },
  {
    q: "How do I pay for a session?",
    a: "Payment is taken securely online via Stripe when you book. You'll receive an email confirmation and can view your full payment history and receipts in your dashboard.",
  },
  {
    q: "What if I need to cancel a session?",
    a: "Cancellations made more than 24 hours before a session are free and fully refunded. Cancellations within 24 hours of the session are not refunded, in fairness to your tutor's reserved time. See our Cancellation & Refund Policy for full details.",
  },
  {
    q: "How much does a tutor cost?",
    a: "Each tutor sets their own hourly rate, shown on their profile before you book. There are no hidden fees for clients.",
  },
  {
    q: "Can I leave a review?",
    a: "Yes — after a completed session, you can leave a rating and review for your tutor from your bookings dashboard.",
  },
  {
    q: "What subjects and levels do you cover?",
    a: "We cover the core GCSE and A-Level subjects across the main UK exam boards used in Guernsey (AQA, Edexcel, OCR, WJEC/Eduqas and others). Use Find a Tutor to filter by subject, level and exam board.",
  },
];

export default function FaqPage() {
  return (
    <div className="py-16">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
          Frequently Asked Questions
        </h1>

        <dl className="mt-10 divide-y divide-navy/10">
          {FAQS.map((item) => (
            <div key={item.q} className="py-6">
              <dt className="font-heading text-base font-semibold text-navy">
                {item.q}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-navy/70">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}
