"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDb } from "@/db";
import * as schema from "@/db/schema";
import { hashPassword } from "@/lib/password";

const resetSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function resetPassword(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { token, password } = parsed.data;
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

  const hashed = await hashPassword(password);

  await Promise.all([
    db
      .update(schema.users)
      .set({ password: hashed })
      .where(eq(schema.users.email, record.identifier)),
    db
      .delete(schema.verificationTokens)
      .where(
        and(
          eq(schema.verificationTokens.identifier, record.identifier),
          eq(schema.verificationTokens.token, token),
        ),
      ),
  ]);

  redirect("/sign-in?reset=true");
}
