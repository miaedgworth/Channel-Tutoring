import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

const columns = [
  {
    heading: "For Clients",
    links: [
      { href: "/find-a-tutor", label: "Find a Tutor" },
      { href: "/pricing", label: "Pricing" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/news", label: "News" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "/join-as-a-tutor", label: "Become a Tutor" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/legal/privacy-policy", label: "Privacy Policy" },
      { href: "/legal/terms", label: "Terms & Conditions" },
      { href: "/legal/registration-agreement", label: "Registration Agreement" },
      { href: "/legal/cookie-policy", label: "Cookie Policy" },
      { href: "/legal/safeguarding-policy", label: "Safeguarding Policy" },
      { href: "/legal/cancellation-refund-policy", label: "Cancellation & Refunds" },
      { href: "/legal/tutor-agreement", label: "Tutor Agreement" },
      { href: "/legal/acceptable-use-policy", label: "Acceptable Use Policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-white/90">
      <Container className="py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 p-1">
                <Image
                  src="/logo-icon.png"
                  alt="Channel Tutoring"
                  width={449}
                  height={419}
                  className="h-full w-auto"
                />
              </span>
              <span className="font-heading text-lg font-bold text-white">
                Channel Tutoring
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/70">
              Trusted, one-to-one GCSE and A-Level tuition for students across
              Guernsey — delivered by vetted, experienced tutors.
            </p>
            <div className="mt-6 max-w-xs">
              <p className="text-sm font-semibold text-white">
                Stay up to date
              </p>
              <p className="mt-1 text-xs text-white/60">
                Occasional tips and news from Channel Tutoring. Unsubscribe
                any time.
              </p>
              <NewsletterForm compact />
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-heading text-sm font-semibold text-gold">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Channel Tutoring, Guernsey. All
            rights reserved.
          </p>
          <p>Registered in Guernsey · GCSE &amp; A-Level Tuition</p>
        </div>
      </Container>
    </footer>
  );
}
