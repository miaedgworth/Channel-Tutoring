"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/credit", label: "Credit Balance" },
  { href: "/dashboard/payments", label: "Payments & Receipts" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 space-y-1" aria-label="Dashboard">
      {NAV.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
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
