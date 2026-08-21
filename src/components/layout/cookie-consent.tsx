"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ct-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!stored) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  function choose(value: "accepted" | "essential-only") {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-navy/10 bg-white/98 p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-navy/80">
          We use essential cookies to make Channel Tutoring work, and optional
          analytics cookies to help us improve it. Read our{" "}
          <Link href="/legal/cookie-policy" className="underline text-navy">
            Cookie Policy
          </Link>{" "}
          to learn more.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => choose("essential-only")}
          >
            Essential Only
          </Button>
          <Button variant="gold" size="sm" onClick={() => choose("accepted")}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
