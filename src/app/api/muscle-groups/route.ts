import { eq, or } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const groups = await db
    .select()
    .from(schema.muscleGroups)
    .where(
      or(
        eq(schema.muscleGroups.isSystem, true),
        eq(schema.muscleGroups.userId, userId),
      ),
    );

  return Response.json(groups);
}

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

export async function POST(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [group] = await db
    .insert(schema.muscleGroups)
    .values({ userId, name: result.data.name })
    .returning();

  return Response.json(group, { status: 201 });
}
