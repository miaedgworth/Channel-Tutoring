import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, UserStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: Role;
    status: UserStatus;
  }
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
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
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      // Re-read role/status from the database on every request instead of
      // trusting the JWT's snapshot from sign-in time — otherwise
      // suspending a user (or changing their role) has no effect on
      // sessions they already hold until that JWT expires (up to 30 days
      // by default), leaving a suspended account fully able to use the
      // site in the meantime.
      const current = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { role: true, status: true },
      });
      session.user.role = current?.role ?? (token.role as Role);
      session.user.status = current?.status ?? (token.status as UserStatus);
      return session;
    },
  },
});
