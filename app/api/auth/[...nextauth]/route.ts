/* eslint-disable @typescript-eslint/no-explicit-any */
//import prisma from "@/lib/connection.prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import prisma from "@/lib/connection.prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.password) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            image: user.image,
          };
        } catch (error) {
          console.error("Authorize error:", error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // For OAuth logins, we need to check if the user exists and create them if they don't
        if (account?.provider === "google" || account?.provider === "github") {
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
            update: {}, // Don't update anything if user exists
          });
          user.id = dbUser.id; // Use the database ID instead of OAuth provider ID
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }

      // Handle updates
      if (trigger === "update" && session?.user) {
        token.username = session.user.username;
        return token;
      }

      // On subsequent calls, fetch fresh user data
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, username: true, image: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = dbUser.username;
        }
      } catch (error) {
        console.error("JWT callback error:", error);
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = (token.username as string) || null;
      }
      return session;
    },
    /*async jwt({ token, user }) {
    // When user signs-in (credentials or adapter), `user` is set
    if (user) {
      token.id = (user as any).id ?? token.id;
      token.username = (user as any).username ?? token.username ?? null;
      token.email = (user as any).email ?? token.email ?? null;
    }

    // For OAuth sign-ins where `user` may not be present in subsequent calls,
    // try to resolve DB id once using email (if token.id missing but we have token.email).
    if (!token.id && token.email) {
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, username: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.username = token.username ?? dbUser.username ?? null;
        }
      } catch (err) {
        console.error("jwt callback DB lookup failed:", err);
      }
    }

    return token;
  },
    /*async session({ session, token }) {
      const t = token as { id?: string; username?: string };
      session.user.id = t.id ?? "";
      session.user.username = t.username ?? "";
      return session;
    },*/
    /* async session({ session, token }) {
      // Ensure token.id exists
      const userId = token.id as string ;
      if (!session.user) return session;

      if (userId) {
        // Fetch authoritative fields from DB
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true, email: true, image: true },
        });

        if (dbUser) {
          session.user.username =
            dbUser.username ?? session.user.username ?? null;
          session.user.email = dbUser.email ?? session.user.email;
          session.user.image = dbUser.image ?? session.user.image;
        }
      } else {
        // fallback: keep whatever is in token/session
        session.user.username =
          (token.username as string | null) ?? session.user.username ?? null;
      }

      return session;
    },*/

    /* async redirect({ url, baseUrl }) {
      return baseUrl;
    },
  
    */
  },
  /* pages: {
    // app folder contains `/signin`, ensure NextAuth points to the correct route
    signIn: "/signin",
    newUser: "/onboarding",
  },*/
};
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
