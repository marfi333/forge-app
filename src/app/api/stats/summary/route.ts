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

function getDateRange(period: "week" | "month", now: Date) {
  const currentEnd = new Date(now);
  currentEnd.setHours(23, 59, 59, 999);

  const currentStart = new Date(now);
  if (period === "week") {
    const day = currentStart.getDay();
    currentStart.setDate(currentStart.getDate() - day + (day === 0 ? -6 : 1));
  } else {
    currentStart.setDate(1);
  }
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  if (period === "week") {
    const day = previousStart.getDay();
    previousStart.setDate(previousStart.getDate() - day + (day === 0 ? -6 : 1));
  } else {
    previousStart.setDate(1);
  }
  previousStart.setHours(0, 0, 0, 0);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return {
    current: { start: fmt(currentStart), end: fmt(currentEnd) },
    previous: { start: fmt(previousStart), end: fmt(previousEnd) },
  };
}

function computeStats(
  sessionDates: { sessionId: string; date: string }[],
  exerciseMap: Map<string, { id: string; sessionId: string; name: string }>,
  completedSets: {
    sessionExerciseId: string;
    weight: number | null;
    reps: number | null;
  }[],
  range: { start: string; end: string },
) {
  const filteredSessions = sessionDates.filter(
    (s) => s.date >= range.start && s.date <= range.end,
  );
  const sessionIds = new Set(filteredSessions.map((s) => s.sessionId));

  let totalVolume = 0;
  let totalSets = 0;
  const prMap = new Map<string, number>();

  for (const set of completedSets) {
    const exercise = exerciseMap.get(set.sessionExerciseId);
    if (!exercise || !sessionIds.has(exercise.sessionId)) continue;
    totalSets++;
    if (set.weight !== null && set.reps !== null) {
      totalVolume += set.weight * set.reps;
    }
    if (set.weight !== null) {
      const current = prMap.get(exercise.name) ?? 0;
      if (set.weight > current) prMap.set(exercise.name, set.weight);
    }
  }

  return {
    totalVolume,
    totalSets,
    workoutCount: filteredSessions.length,
    prCount: prMap.size,
  };
}

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "week";
  if (period !== "week" && period !== "month") {
    return badRequest("period must be 'week' or 'month'");
  }

  const ranges = getDateRange(period, new Date());

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

  if (userSessions.length === 0) {
    return Response.json({
      current: { totalVolume: 0, totalSets: 0, workoutCount: 0, prCount: 0 },
      previous: { totalVolume: 0, totalSets: 0, workoutCount: 0, prCount: 0 },
    });
  }

  const sessionIds = userSessions.map((s) => s.sessionId);

  const exercises = await db.select().from(schema.sessionExercises);
  const matchingExercises = exercises.filter((e) =>
    sessionIds.includes(e.sessionId),
  );

  const exerciseMap = new Map(matchingExercises.map((e) => [e.id, e]));
  const exerciseIds = matchingExercises.map((e) => e.id);

  const allSets = await db.select().from(schema.exerciseSets);

  const matchingSets = allSets.filter(
    (s) =>
      exerciseIds.includes(s.sessionExerciseId) &&
      s.reps !== null &&
      s.weight !== null,
  );

  const current = computeStats(
    userSessions,
    exerciseMap,
    matchingSets,
    ranges.current,
  );
  const previous = computeStats(
    userSessions,
    exerciseMap,
    matchingSets,
    ranges.previous,
  );

  return Response.json({ current, previous });
}
