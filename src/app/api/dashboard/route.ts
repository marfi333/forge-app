import { and, eq, gte, lte } from "drizzle-orm";
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
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

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

  return Response.json({
    today,
    weekStart,
    weekEnd,
    weeklyPlan,
    completedCount,
    workoutDays,
    restDays,
  });
}
