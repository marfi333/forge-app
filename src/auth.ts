import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createDb } from "./db";
import * as schema from "./db/schema";

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
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
  };
});
