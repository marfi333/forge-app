import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

export async function DELETE(
  _request: Request,
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

  await db
    .delete(schema.sessionExercises)
    .where(eq(schema.sessionExercises.id, exerciseId));

  return new Response(null, { status: 204 });
}
