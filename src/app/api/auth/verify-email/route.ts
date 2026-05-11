import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createDb } from "@/db";
import * as schema from "@/db/schema";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return redirect("/sign-in?error=invalid_token");
  }

  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const [record] = await db
    .select()
    .from(schema.verificationTokens)
    .where(eq(schema.verificationTokens.token, token))
    .limit(1);

  if (!record) {
    return redirect("/sign-in?error=invalid_token");
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
    return redirect("/sign-in?error=token_expired");
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

  return redirect("/sign-in?verified=true");
}
