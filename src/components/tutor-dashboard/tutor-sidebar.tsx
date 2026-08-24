"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/tutor-dashboard", label: "Overview" },
  { href: "/tutor-dashboard/profile", label: "My Profile" },
  { href: "/tutor-dashboard/availability", label: "Availability" },
  { href: "/tutor-dashboard/bookings", label: "Bookings" },
  { href: "/tutor-dashboard/messages", label: "Messages" },
  { href: "/tutor-dashboard/earnings", label: "Earnings" },
  { href: "/tutor-dashboard/settings", label: "Settings" },
  { href: "/legal/tutor-agreement", label: "Tutor Agreement" },
];

export function TutorSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1" aria-label="Tutor dashboard">
      {NAV.map((item) => {
        const active =
          item.href === "/tutor-dashboard"
            ? pathname === "/tutor-dashboard"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-navy text-white"
                : "text-navy/70 hover:bg-navy/5 hover:text-navy",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
