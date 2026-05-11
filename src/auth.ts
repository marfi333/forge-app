import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createDb } from "./db";
import * as schema from "./db/schema";
import type { Locale } from "./i18n/config";
import { locales } from "./i18n/config";

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
    providers: [Google],
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
