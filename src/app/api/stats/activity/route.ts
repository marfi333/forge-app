import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { badRequest, getAuthedDb, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const weeks = Number(searchParams.get("weeks") ?? "12");
  if (Number.isNaN(weeks) || weeks < 1 || weeks > 52) {
    return badRequest("weeks must be 1-52");
  }

  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - weeks * 7);
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

  const userSessions = await db
    .select({
      sessionId: schema.workoutSessions.id,
      date: schema.workoutSessions.date,
    })
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        eq(schema.workoutSessions.status, "completed"),
      ),
    );

  const recentSessions = userSessions.filter((s) => s.date >= startStr);

  if (recentSessions.length === 0) {
    return Response.json({ days: [], weeks });
  }

  const sessionIds = recentSessions.map((s) => s.sessionId);

  const exercises = await db.select().from(schema.sessionExercises);
  const matchingExercises = exercises.filter((e) =>
    sessionIds.includes(e.sessionId),
  );
  const exerciseIds = matchingExercises.map((e) => e.id);
  const exerciseSessionMap = new Map(
    matchingExercises.map((e) => [e.id, e.sessionId]),
  );

  const allSets = await db.select().from(schema.exerciseSets);

  const matchingSets = allSets.filter(
    (s) =>
      exerciseIds.includes(s.sessionExerciseId) &&
      s.reps !== null &&
      s.weight !== null,
  );

  const dayMap = new Map<string, { sets: number; volume: number }>();

  for (const set of matchingSets) {
    const sessionId = exerciseSessionMap.get(set.sessionExerciseId);
    if (!sessionId) continue;
    const session = recentSessions.find((s) => s.sessionId === sessionId);
    if (!session) continue;

    const entry = dayMap.get(session.date) ?? { sets: 0, volume: 0 };
    entry.sets++;
    if (set.weight !== null && set.reps !== null) {
      entry.volume += set.weight * set.reps;
    }
    dayMap.set(session.date, entry);
  }

  const days = [...dayMap.entries()]
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return Response.json({ days, weeks });
}
