import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { locales } from "@/i18n/config";
import { getAuthedDb, unauthorized } from "@/lib/api";

const localeSchema = z.object({
  locale: z.enum(locales),
});

export async function PATCH(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const parsed = localeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { locale } = parsed.data;

  await db
    .update(schema.users)
    .set({ locale })
    .where(eq(schema.users.id, userId));

  const response = Response.json({ locale });
  response.headers.append(
    "Set-Cookie",
    `NEXT_LOCALE=${locale}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax`,
  );

  return response;
}
