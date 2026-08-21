"use client";

import { useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/button";

export function MobileNav({
  links,
  isLoggedIn,
  role,
}: {
  links: { href: string; label: string }[];
  isLoggedIn: boolean;
  role?: string;
}) {
  const [open, setOpen] = useState(false);

  const dashboardHref =
    role === "ADMIN" ? "/admin" : role === "TUTOR" ? "/tutor-dashboard" : "/dashboard";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
      >
        <svg
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {open ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-16 border-b border-navy/10 bg-white shadow-lg"
        >
          <nav className="flex flex-col p-4 gap-1" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-navy hover:bg-navy/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-navy/10 pt-3">
              {isLoggedIn ? (
                <LinkButton href={dashboardHref} variant="primary" size="sm">
                  My Dashboard
                </LinkButton>
              ) : (
                <>
                  <LinkButton href="/login" variant="outline" size="sm">
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
          </nav>
        </div>
      )}
    </div>
  );
}
