"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function UserMenu({ name, role }: { name: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const dashboardHref =
    role === "ADMIN" ? "/admin" : role === "TUTOR" ? "/tutor-dashboard" : "/dashboard";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-navy/15 pl-1 pr-3 py-1 text-sm font-medium text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-dark"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white text-xs font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate">{name}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-md border border-navy/10 bg-white py-1 shadow-lg"
        >
          <Link
            href={dashboardHref}
            role="menuitem"
            className="block px-4 py-2 text-sm text-navy hover:bg-navy/5"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <Link
            href={
              role === "TUTOR"
                ? "/tutor-dashboard/settings"
                : role === "ADMIN"
                  ? "/admin/settings"
                  : "/dashboard/settings"
            }
            role="menuitem"
            className="block px-4 py-2 text-sm text-navy hover:bg-navy/5"
            onClick={() => setOpen(false)}
          >
            Account Settings
          </Link>
          <button
            role="menuitem"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="block w-full px-4 py-2 text-left text-sm text-red hover:bg-red/5"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
