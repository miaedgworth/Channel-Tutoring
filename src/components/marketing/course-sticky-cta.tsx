"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/utils";

// Renders an invisible sentinel right after the hero, then a fixed bar
// (bottom on mobile, top — below the site header — on desktop) that only
// appears once the hero has scrolled past. Uses an IntersectionObserver on
// the sentinel rather than a scroll listener so it's cheap and doesn't
// affect page layout/height (no layout shift).
export function CourseStickyCta({ fromPricePence }: { fromPricePence: number | null }) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-navy/10 bg-white/95 backdrop-blur transition-transform duration-200 sm:bottom-auto sm:top-16 sm:border-b sm:border-t-0 ${
          visible ? "translate-y-0" : "translate-y-full sm:-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-navy">
            {fromPricePence != null
              ? `From ${formatCurrency(fromPricePence)}/day`
              : "Book your place"}
          </p>
          <a
            href="#booking"
            tabIndex={visible ? 0 : -1}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-gold px-4 py-2 text-sm font-semibold text-navy-dark transition-colors hover:bg-gold-dark hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
          >
            Book now
          </a>
        </div>
      </div>
    </>
  );
}
