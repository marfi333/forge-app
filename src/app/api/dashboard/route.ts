import { and, desc, eq, gte, lt, lte, ne } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";
import { WEEKDAYS } from "@/lib/constants";

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

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calculateStreak(completedDates: string[], today: string): number {
  if (completedDates.length === 0) return 0;
  const dateSet = new Set(completedDates);
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);

  if (!dateSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const key = fmtDate(cursor);
    if (dateSet.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function daysBetween(from: string, to: string): number {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  return Math.round(
    (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const today = new Date().toISOString().slice(0, 10);
  const { weekStart, weekEnd } = getWeekBounds(today);

  const [weekSessions, templates, calendarDays] = await Promise.all([
    db
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
      ),
    db
      .select({
        id: schema.workoutTemplates.id,
        name: schema.workoutTemplates.name,
        weekday: schema.workoutTemplates.weekday,
        muscleGroup: schema.workoutTemplates.muscleGroup,
      })
      .from(schema.workoutTemplates)
      .where(eq(schema.workoutTemplates.userId, userId)),
    db
      .select({
        date: schema.calendarDays.date,
        type: schema.calendarDays.type,
      })
      .from(schema.calendarDays)
      .where(
        and(
          eq(schema.calendarDays.userId, userId),
          gte(schema.calendarDays.date, weekStart),
          lte(schema.calendarDays.date, weekEnd),
        ),
      ),
  ]);

  const streakCutoff = (() => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - 60);
    return fmtDate(d);
  })();

  const [recentCompletedDates, lastCompletedSession] = await Promise.all([
    db
      .select({ date: schema.workoutSessions.date })
      .from(schema.workoutSessions)
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          eq(schema.workoutSessions.status, "completed"),
          lte(schema.workoutSessions.date, today),
          gte(schema.workoutSessions.date, streakCutoff),
        ),
      )
      .orderBy(desc(schema.workoutSessions.date)),
    db
      .select({
        id: schema.workoutSessions.id,
        date: schema.workoutSessions.date,
      })
      .from(schema.workoutSessions)
      .where(
        and(
          eq(schema.workoutSessions.userId, userId),
          eq(schema.workoutSessions.status, "completed"),
          lte(schema.workoutSessions.date, today),
        ),
      )
      .orderBy(desc(schema.workoutSessions.date))
      .limit(1),
  ]);

  const templatesByWeekday = new Map<
    string,
    { id: string; name: string; muscleGroup: string | null }
  >();
  for (const t of templates) {
    if (t.weekday) {
      templatesByWeekday.set(t.weekday, {
        id: t.id,
        name: t.name,
        muscleGroup: t.muscleGroup,
      });
    }
  }

  const calendarByDate = new Map<string, string>();
  for (const d of calendarDays) {
    calendarByDate.set(d.date, d.type);
  }

  const completedDates = new Set(
    weekSessions.filter((s) => s.status === "completed").map((s) => s.date),
  );

  const startDate = new Date(`${weekStart}T12:00:00`);
  const weeklyPlan = WEEKDAYS.map((weekday, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const date = fmtDate(d);

    const template = templatesByWeekday.get(weekday);
    const calendarType = calendarByDate.get(date);
    const hasSession = weekSessions.some((s) => s.date === date);
    const isCompleted = completedDates.has(date);

    let dayType: "workout" | "rest" = "rest";
    if (calendarType === "workout" || template) {
      dayType = "workout";
    }

    return {
      weekday,
      date,
      dayType,
      template: template
        ? {
            id: template.id,
            name: template.name,
            muscleGroup: template.muscleGroup,
          }
        : null,
      hasSession,
      isCompleted,
    };
  });

  const workoutDays = weeklyPlan.filter((d) => d.dayType === "workout").length;
  const restDays = weeklyPlan.filter((d) => d.dayType === "rest").length;
  const completedCount = weeklyPlan.filter((d) => d.isCompleted).length;

  const todayPlan = weeklyPlan.find((d) => d.date === today);
  const todayIsWorkout = todayPlan?.dayType === "workout";

  const streak = calculateStreak(
    recentCompletedDates.map((s) => s.date),
    today,
  );

  const lastSession = lastCompletedSession[0] ?? null;
  const daysSinceLastWorkout = lastSession
    ? daysBetween(lastSession.date, today)
    : null;

  let recentPR: { exercise: string; weight: number } | null = null;
  if (lastSession) {
    const sets = await db
      .select({
        exerciseName: schema.sessionExercises.name,
        weight: schema.exerciseSets.weight,
      })
      .from(schema.exerciseSets)
      .innerJoin(
        schema.sessionExercises,
        eq(schema.exerciseSets.sessionExerciseId, schema.sessionExercises.id),
      )
      .where(
        and(
          eq(schema.sessionExercises.sessionId, lastSession.id),
          eq(schema.exerciseSets.completed, true),
        ),
      );

    const maxByExercise = new Map<string, number>();
    for (const s of sets) {
      if (s.weight == null) continue;
      const current = maxByExercise.get(s.exerciseName) ?? 0;
      if (s.weight > current) maxByExercise.set(s.exerciseName, s.weight);
    }

    if (maxByExercise.size > 0) {
      const priorSets = await db
        .select({
          exerciseName: schema.sessionExercises.name,
          weight: schema.exerciseSets.weight,
        })
        .from(schema.exerciseSets)
        .innerJoin(
          schema.sessionExercises,
          eq(schema.exerciseSets.sessionExerciseId, schema.sessionExercises.id),
        )
        .innerJoin(
          schema.workoutSessions,
          eq(schema.sessionExercises.sessionId, schema.workoutSessions.id),
        )
        .where(
          and(
            eq(schema.workoutSessions.userId, userId),
            eq(schema.workoutSessions.status, "completed"),
            ne(schema.workoutSessions.id, lastSession.id),
            lt(schema.workoutSessions.date, lastSession.date),
            eq(schema.exerciseSets.completed, true),
          ),
        );

      const priorMaxByExercise = new Map<string, number>();
      for (const s of priorSets) {
        if (s.weight == null) continue;
        const current = priorMaxByExercise.get(s.exerciseName) ?? 0;
        if (s.weight > current)
          priorMaxByExercise.set(s.exerciseName, s.weight);
      }

      let bestPR: { exercise: string; weight: number } | null = null;
      for (const [exercise, weight] of maxByExercise) {
        const priorMax = priorMaxByExercise.get(exercise) ?? 0;
        if (weight > priorMax) {
          if (!bestPR || weight > bestPR.weight) {
            bestPR = { exercise, weight };
          }
        }
      }
      recentPR = bestPR;
    }
  }

  return Response.json({
    today,
    weekStart,
    weekEnd,
    weeklyPlan,
    completedCount,
    workoutDays,
    restDays,
    motivation: {
      daysSinceLastWorkout,
      streak,
      todayIsWorkout,
      recentPR,
    },
  });
}
