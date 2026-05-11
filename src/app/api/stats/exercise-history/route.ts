import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { badRequest, getAuthedDb, unauthorized } from "@/lib/api";

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) return badRequest("name query parameter is required");

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

  if (userSessions.length === 0) return Response.json([]);

  const sessionIds = userSessions.map((s) => s.sessionId);
  const sessionDateMap = new Map(
    userSessions.map((s) => [s.sessionId, s.date]),
  );

  const exercises = await db
    .select()
    .from(schema.sessionExercises)
    .where(eq(schema.sessionExercises.name, name));

  const matchingExercises = exercises.filter((e) =>
    sessionIds.includes(e.sessionId),
  );

  if (matchingExercises.length === 0) return Response.json([]);

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

  const history: {
    date: string;
    sets: { setNumber: number; reps: number | null; weight: number | null }[];
    bestWeight: number | null;
    totalVolume: number;
  }[] = [];

  const byDate = new Map<
    string,
    { setNumber: number; reps: number | null; weight: number | null }[]
  >();

  for (const set of matchingSets) {
    const sessionId = exerciseSessionMap.get(set.sessionExerciseId);
    if (!sessionId) continue;
    const date = sessionDateMap.get(sessionId);
    if (!date) continue;

    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)?.push({
      setNumber: set.setNumber,
      reps: set.reps,
      weight: set.weight,
    });
  }

  for (const [date, sets] of [...byDate.entries()].toSorted((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const weights = sets.flatMap((s) =>
      s.weight !== null ? [s.weight] : [],
    );
    const bestWeight = weights.length > 0 ? Math.max(...weights) : null;
    const totalVolume = sets.reduce((sum, s) => {
      if (s.weight !== null && s.reps !== null) return sum + s.weight * s.reps;
      return sum;
    }, 0);

    history.push({ date, sets, bestWeight, totalVolume });
  }

  return Response.json(history);
}
