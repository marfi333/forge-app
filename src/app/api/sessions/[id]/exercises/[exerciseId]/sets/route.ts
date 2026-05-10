import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const addSetSchema = z.object({
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId } = await params;

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

  const body = await request.json();
  const result = addSetSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [set] = await db
    .insert(schema.exerciseSets)
    .values({
      sessionExerciseId: exerciseId,
      setNumber: result.data.setNumber,
      reps: result.data.reps,
      weight: result.data.weight,
    })
    .returning();

  return Response.json(set, { status: 201 });
}
