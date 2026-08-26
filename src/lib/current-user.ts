import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // session.user.status/sessionRevoked are refreshed from the database on
  // every request (see the session callback in auth.ts) specifically so a
  // suspension or a password change takes effect immediately, not just on
  // that user's next login.
  if (session.user.status === "SUSPENDED" || session.user.sessionRevoked) {
    redirect("/login");
  }
  if (role && session.user.role !== role) {
    redirect("/");
  }
  return session.user;
}
