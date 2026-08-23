"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tutor-applications", label: "Tutor Applications" },
  { href: "/admin/tutors", label: "Tutors" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/revenue", label: "Revenue" },
  { href: "/admin/content", label: "Content" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1" aria-label="Admin">
      {NAV.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
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
