import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq } from "drizzle-orm";
import { createDb } from "@/db";
import * as schema from "@/db/schema";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token;
  if (!token || typeof token !== "string") {
    return Response.json({ error: "invalid_token" }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const [record] = await db
    .select()
    .from(schema.verificationTokens)
    .where(eq(schema.verificationTokens.token, token))
    .limit(1);

  if (!record) {
    return Response.json({ error: "invalid_token" }, { status: 400 });
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
    return Response.json({ error: "token_expired" }, { status: 400 });
  }

  await Promise.all([
    db
      .update(schema.users)
      .set({ emailVerified: new Date() })
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

  return Response.json({ success: true });
}
