import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const addExerciseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  order: z.number().int().min(0),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const [{ id }, body] = await Promise.all([params, request.json()]);

  const result = addExerciseSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [session] = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, userId),
      ),
    );
  if (!session) return notFound();

  const [exercise] = await db
    .insert(schema.sessionExercises)
    .values({
      sessionId: id,
      name: result.data.name,
      order: result.data.order,
    })
    .returning();

  return Response.json(exercise, { status: 201 });
}
