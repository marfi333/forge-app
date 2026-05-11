"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "@/db";
import * as schema from "@/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotSchema = z.object({
  email: z.string().email(),
});

export type ForgotPasswordState = {
  success?: boolean;
  error?: string;
};

export async function forgotPassword(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotSchema.safeParse({
    email: formData.get("email") as string,
  });

  if (!parsed.success) {
    return { success: true };
  }

  const { email } = parsed.data;
  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (user) {
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await sendPasswordResetEmail(env.RESEND_API_KEY, email, token, "en", env.FROM_MAIL_URL);

    await db.insert(schema.verificationTokens).values({
      identifier: email,
      token,
      expires,
    });
  }

  return { success: true };
}
