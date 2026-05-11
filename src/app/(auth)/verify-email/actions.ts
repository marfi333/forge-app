"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createDb } from "@/db";
import * as schema from "@/db/schema";

export type VerifyEmailState = {
  error?: string;
};

export async function verifyEmail(
  _prev: VerifyEmailState,
  formData: FormData,
): Promise<VerifyEmailState> {
  const token = formData.get("token") as string;
  if (!token) {
    return { error: "invalid_token" };
  }

  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const [record] = await db
    .select()
    .from(schema.verificationTokens)
    .where(eq(schema.verificationTokens.token, token))
    .limit(1);

  if (!record) {
    return { error: "invalid_token" };
  }

  if (record.expires < new Date()) {
    await db
      .delete(schema.verificationTokens)
      .where(
        and(
          eq(schema.verificationTokens.identifier, record.identifier),
          eq(schema.verificationTokens.token, token),
        ),
      );
    return { error: "token_expired" };
  }

  await db
    .update(schema.users)
    .set({ emailVerified: new Date() })
    .where(eq(schema.users.email, record.identifier));

  await db
    .delete(schema.verificationTokens)
    .where(
      and(
        eq(schema.verificationTokens.identifier, record.identifier),
        eq(schema.verificationTokens.token, token),
      ),
    );

  redirect("/sign-in?verified=true");
}
