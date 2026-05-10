import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const updateSessionSchema = z.object({
  status: z.enum(["in_progress", "completed"]).optional(),
  notes: z.string().optional(),
});

async function getOwnedSession(
  db: NonNullable<Awaited<ReturnType<typeof getAuthedDb>>["db"]>,
  userId: string,
  id: string,
) {
  const [session] = await db
    .select()
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.id, id),
        eq(schema.workoutSessions.userId, userId),
      ),
    );
  return session ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const session = await getOwnedSession(db, userId, id);
  if (!session) return notFound();

  const exercises = await db
    .select()
    .from(schema.sessionExercises)
    .where(eq(schema.sessionExercises.sessionId, id))
    .orderBy(schema.sessionExercises.order);

  const exercisesWithSets = await Promise.all(
    exercises.map(async (exercise) => {
      const sets = await db
        .select()
        .from(schema.exerciseSets)
        .where(eq(schema.exerciseSets.sessionExerciseId, exercise.id))
        .orderBy(schema.exerciseSets.setNumber);
      return { ...exercise, sets };
    }),
  );

  return Response.json({ ...session, exercises: exercisesWithSets });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const session = await getOwnedSession(db, userId, id);
  if (!session) return notFound();

  const body = await request.json();
  const result = updateSessionSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(schema.workoutSessions)
    .set(result.data)
    .where(eq(schema.workoutSessions.id, id))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const session = await getOwnedSession(db, userId, id);
  if (!session) return notFound();

  await db
    .delete(schema.workoutSessions)
    .where(eq(schema.workoutSessions.id, id));

  return new Response(null, { status: 204 });
}
