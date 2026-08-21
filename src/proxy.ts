import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const roleForPrefix: { prefix: string; role: "CLIENT" | "TUTOR" | "ADMIN" }[] = [
  { prefix: "/dashboard", role: "CLIENT" },
  { prefix: "/tutor-dashboard", role: "TUTOR" },
  { prefix: "/admin", role: "ADMIN" },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const match = roleForPrefix.find((r) => pathname.startsWith(r.prefix));
  if (!match) return NextResponse.next();

  const user = req.auth?.user;
  if (!user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user.role !== match.role) {
    const fallback =
      user.role === "ADMIN"
        ? "/admin"
        : user.role === "TUTOR"
          ? "/tutor-dashboard"
          : "/dashboard";
    return NextResponse.redirect(new URL(fallback, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/tutor-dashboard/:path*", "/admin/:path*"],
};
