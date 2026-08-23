import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { LinkButton } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";

const NAV_LINKS = [
  { href: "/find-a-tutor", label: "Find a Tutor" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/courses", label: "Courses" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo-icon.png"
            alt="Channel Tutoring"
            width={449}
            height={419}
            priority
            className="h-10 w-auto"
          />
          <span className="font-heading text-lg font-bold text-navy hidden sm:inline">
            Channel Tutoring
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-navy/80 hover:text-navy transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          {session?.user ? (
            <UserMenu
              name={session.user.name ?? session.user.email ?? "Account"}
              role={session.user.role}
            />
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Log In
              </LinkButton>
              <LinkButton href="/join-as-a-tutor" variant="outline" size="sm">
                Become a Tutor
              </LinkButton>
              <LinkButton href="/register" variant="gold" size="sm">
                Sign Up
              </LinkButton>
            </>
          )}
        </div>

        <MobileNav
          links={NAV_LINKS}
          isLoggedIn={Boolean(session?.user)}
          role={session?.user?.role}
        />
      </Container>
    </header>
  );
}
