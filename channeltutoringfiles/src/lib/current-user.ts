import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";

export async function requireUser(role?: Role) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  if (role && session.user.role !== role) {
    redirect("/");
  }
  return session.user;
}
