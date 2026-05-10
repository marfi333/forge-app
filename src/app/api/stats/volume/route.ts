import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { badRequest, getAuthedDb, unauthorized } from "@/lib/api";

function getWeekStart(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "session";
  if (period !== "session" && period !== "week") {
    return badRequest("period must be 'session' or 'week'");
  }

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

  const exercises = await db.select().from(schema.sessionExercises);
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

  if (period === "session") {
    const bySession = new Map<
      string,
      { date: string; volume: number; setCount: number }
    >();

    for (const set of matchingSets) {
      const sessionId = exerciseSessionMap.get(set.sessionExerciseId);
      if (!sessionId) continue;
      const date = sessionDateMap.get(sessionId);
      if (!date) continue;

      if (!bySession.has(sessionId)) {
        bySession.set(sessionId, { date, volume: 0, setCount: 0 });
      }
      const entry = bySession.get(sessionId);
      if (!entry) continue;
      if (set.weight !== null && set.reps !== null) {
        entry.volume += set.weight * set.reps;
      }
      entry.setCount++;
    }

    const result = [...bySession.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    return Response.json(result);
  }

  const byWeek = new Map<
    string,
    {
      weekStart: string;
      volume: number;
      setCount: number;
      sessionCount: number;
    }
  >();
  const weekSessions = new Map<string, Set<string>>();

  for (const set of matchingSets) {
    const sessionId = exerciseSessionMap.get(set.sessionExerciseId);
    if (!sessionId) continue;
    const date = sessionDateMap.get(sessionId);
    if (!date) continue;
    const weekStart = getWeekStart(date);

    if (!byWeek.has(weekStart)) {
      byWeek.set(weekStart, {
        weekStart,
        volume: 0,
        setCount: 0,
        sessionCount: 0,
      });
      weekSessions.set(weekStart, new Set());
    }
    const entry = byWeek.get(weekStart);
    if (!entry) continue;
    if (set.weight !== null && set.reps !== null) {
      entry.volume += set.weight * set.reps;
    }
    entry.setCount++;
    weekSessions.get(weekStart)?.add(sessionId);
  }

  for (const [weekStart, sessions] of weekSessions) {
    const weekEntry = byWeek.get(weekStart);
    if (weekEntry) weekEntry.sessionCount = sessions.size;
  }

  const result = [...byWeek.values()].sort((a, b) =>
    a.weekStart.localeCompare(b.weekStart),
  );
  return Response.json(result);
}
