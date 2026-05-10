import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

const createTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const templates = await db
    .select()
    .from(schema.workoutTemplates)
    .where(eq(schema.workoutTemplates.userId, userId));

  return Response.json(templates);
}

export async function POST(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const result = createTemplateSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [template] = await db
    .insert(schema.workoutTemplates)
    .values({ userId, name: result.data.name })
    .returning();

  return Response.json(template, { status: 201 });
}
