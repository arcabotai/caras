import { auth } from "@/lib/auth";
import { signIn } from "next-auth/react";
import NextAuth from "next-auth";

// Augment NextAuth types so the session callback can safely write session.user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isAdmin?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
  }
}

export { NextAuth };
