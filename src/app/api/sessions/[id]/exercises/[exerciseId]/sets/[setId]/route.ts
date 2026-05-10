import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const updateSetSchema = z.object({
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string; setId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId, setId } = await params;

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
    .select()
    .from(schema.sessionExercises)
    .where(
      and(
        eq(schema.sessionExercises.id, exerciseId),
        eq(schema.sessionExercises.sessionId, id),
      ),
    );
  if (!exercise) return notFound();

  const [existingSet] = await db
    .select()
    .from(schema.exerciseSets)
    .where(
      and(
        eq(schema.exerciseSets.id, setId),
        eq(schema.exerciseSets.sessionExerciseId, exerciseId),
      ),
    );
  if (!existingSet) return notFound();

  const body = await request.json();
  const result = updateSetSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(schema.exerciseSets)
    .set(result.data)
    .where(eq(schema.exerciseSets.id, setId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: Promise<{ id: string; exerciseId: string; setId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId, setId } = await params;

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

  const [set] = await db
    .select()
    .from(schema.exerciseSets)
    .where(
      and(
        eq(schema.exerciseSets.id, setId),
        eq(schema.exerciseSets.sessionExerciseId, exerciseId),
      ),
    );
  if (!set) return notFound();

  await db.delete(schema.exerciseSets).where(eq(schema.exerciseSets.id, setId));

  return new Response(null, { status: 204 });
}
