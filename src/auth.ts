import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { createDb } from "./db";
import * as schema from "./db/schema";
import type { Locale } from "./i18n/config";
import { locales } from "./i18n/config";
import { verifyPassword } from "./lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  return {
    adapter: DrizzleAdapter(db, {
      usersTable: schema.users,
      accountsTable: schema.accounts,
      sessionsTable: schema.sessions,
      verificationTokensTable: schema.verificationTokens,
    }),
    providers: [
      Google,
      Credentials({
        credentials: {
          email: {},
          password: {},
        },
        async authorize(credentials) {
          const email = credentials.email as string;
          const password = credentials.password as string;
          if (!email || !password) return null;

          const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email))
            .limit(1);

          if (!user?.password) return null;
          if (!user.emailVerified) return null;

          const valid = await verifyPassword(password, user.password);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
          };
        },
      }),
    ],
    pages: {
      signIn: "/sign-in",
    },
    session: {
      strategy: "database",
    },
    callbacks: {
      async session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
    events: {
      async signIn({ user }) {
        if (!user.id) return;
        const rows = await db
          .select({ locale: schema.users.locale })
          .from(schema.users)
          .where(eq(schema.users.id, user.id))
          .limit(1);
        const dbLocale = rows[0]?.locale;
        if (dbLocale && locales.includes(dbLocale as Locale)) {
          const cookieStore = await cookies();
          cookieStore.set("NEXT_LOCALE", dbLocale, {
            path: "/",
            maxAge: 365 * 24 * 60 * 60,
            sameSite: "lax",
          });
        }
      },
    },
  };
});
