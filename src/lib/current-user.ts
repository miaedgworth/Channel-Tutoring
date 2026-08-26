import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // session.user.status is refreshed from the database on every request
  // (see the session callback in auth.ts) specifically so a suspension
  // takes effect immediately, not just on the suspended user's next login.
  if (session.user.status === "SUSPENDED") {
    redirect("/login");
  }
  if (role && session.user.role !== role) {
    redirect("/");
  }
  return session.user;
}
