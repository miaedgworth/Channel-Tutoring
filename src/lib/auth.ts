import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    status: UserStatus;
    passwordChangedAt: Date | null;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      // True when the password was changed after this session's JWT was
      // issued — requireUser() treats this the same as SUSPENDED.
      sessionRevoked: boolean;
      name: string;
      email: string;
      image?: string | null;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        if (user.status === "SUSPENDED") {
          throw new Error("ACCOUNT_SUSPENDED");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
          passwordChangedAt: user.passwordChangedAt,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
        // Stashed as a plain number since JWT claims must be serializable.
        token.passwordChangedAt = user.passwordChangedAt?.getTime() ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      // Re-read role/status/passwordChangedAt from the database on every
      // request instead of trusting the JWT's snapshot from sign-in time —
      // otherwise suspending a user, or a password change meant to lock
      // out a stolen session, has no effect on sessions already issued
      // until that JWT expires (up to 30 days by default).
      const current = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true, status: true, passwordChangedAt: true },
      });
      session.user.role = current?.role ?? (token.role as Role);
      session.user.status = current?.status ?? (token.status as UserStatus);
      const tokenPasswordChangedAt = token.passwordChangedAt as number | null;
      session.user.sessionRevoked = Boolean(
        current?.passwordChangedAt &&
          (tokenPasswordChangedAt === null ||
            current.passwordChangedAt.getTime() > tokenPasswordChangedAt),
      );
      return session;
    },
  },
});
