"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import disposableDomainsJson from "disposable-email-domains/index.json";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb } from "@/db";
import * as schema from "@/db/schema";
import { sendVerificationEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";

const disposableDomains = new Set<string>(disposableDomainsJson);

const registerSchema = z
  .object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
  });

export type RegisterState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const domain = email.split("@")[1].toLowerCase();
  if (disposableDomains.has(domain)) {
    return { error: "disposable_email" };
  }

  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existing.length > 0) {
    return { error: "email_exists" };
  }

  const hashed = await hashPassword(password);
  const userId = crypto.randomUUID();
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await sendVerificationEmail(env.RESEND_API_KEY, email, token, "en", env.FROM_MAIL_URL);

  await db.insert(schema.users).values({
    id: userId,
    name,
    email,
    password: hashed,
  });

  await db.insert(schema.verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return { success: true };
}
