import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const userSessions = await db
    .select({ sessionId: schema.workoutSessions.id })
    .from(schema.workoutSessions)
    .where(eq(schema.workoutSessions.userId, userId));

  if (userSessions.length === 0) return Response.json([]);

  const sessionIds = new Set(userSessions.map((s) => s.sessionId));

  const exercises = await db.select().from(schema.sessionExercises);
  const names = [
    ...new Set(
      exercises.filter((e) => sessionIds.has(e.sessionId)).map((e) => e.name),
    ),
  ].sort();

  return Response.json(names);
}
