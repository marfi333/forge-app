import { and, eq, gte, lte } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

function getWeekBounds(today: string) {
  const date = new Date(`${today}T12:00:00`);
  const day = date.getDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  return { weekStart: fmt(monday), weekEnd: fmt(sunday) };
}

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const today = new Date().toISOString().slice(0, 10);
  const { weekStart, weekEnd } = getWeekBounds(today);

  const weekSessions = await db
    .select({
      id: schema.workoutSessions.id,
      date: schema.workoutSessions.date,
      status: schema.workoutSessions.status,
    })
    .from(schema.workoutSessions)
    .where(
      and(
        eq(schema.workoutSessions.userId, userId),
        gte(schema.workoutSessions.date, weekStart),
        lte(schema.workoutSessions.date, weekEnd),
      ),
    );

  const todaySessions = weekSessions.filter((s) => s.date === today);
  const completedThisWeek = weekSessions.filter(
    (s) => s.status === "completed",
  );

  const completedIds = completedThisWeek.map((s) => s.id);
  let totalVolume = 0;

  if (completedIds.length > 0) {
    const exercises = await db
      .select()
      .from(schema.sessionExercises);
    const matchingExercises = exercises.filter((e) =>
      completedIds.includes(e.sessionId),
    );

    if (matchingExercises.length > 0) {
      const exerciseIds = matchingExercises.map((e) => e.id);
      const allSets = await db
        .select()
        .from(schema.exerciseSets)
        .where(eq(schema.exerciseSets.completed, true));

      const matchingSets = allSets.filter((s) =>
        exerciseIds.includes(s.sessionExerciseId),
      );

      for (const set of matchingSets) {
        if (set.weight !== null && set.reps !== null) {
          totalVolume += set.weight * set.reps;
        }
      }
    }
  }

  const workoutDates = new Set(weekSessions.map((s) => s.date));

  return Response.json({
    today,
    weekStart,
    weekEnd,
    sessionsToday: todaySessions.length,
    workoutsThisWeek: completedThisWeek.length,
    totalVolume,
    workoutDates: [...workoutDates],
  });
}
