import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  reps: number | null;
  date: string;
}

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filterName = searchParams.get("name");

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

  let exercises = await db.select().from(schema.sessionExercises);
  exercises = exercises.filter((e) => sessionIds.includes(e.sessionId));
  if (filterName) {
    exercises = exercises.filter((e) => e.name === filterName);
  }

  if (exercises.length === 0) return Response.json([]);

  const exerciseIds = exercises.map((e) => e.id);
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const allSets = await db
    .select()
    .from(schema.exerciseSets)
    .where(eq(schema.exerciseSets.completed, true));

  const matchingSets = allSets.filter((s) =>
    exerciseIds.includes(s.sessionExerciseId),
  );

  const prMap = new Map<string, PersonalRecord>();

  for (const set of matchingSets) {
    if (set.weight === null) continue;
    const exercise = exerciseMap.get(set.sessionExerciseId);
    if (!exercise) continue;
    const date = sessionDateMap.get(exercise.sessionId);
    if (!date) continue;

    const existing = prMap.get(exercise.name);
    if (!existing || set.weight > existing.maxWeight) {
      prMap.set(exercise.name, {
        exerciseName: exercise.name,
        maxWeight: set.weight,
        reps: set.reps,
        date,
      });
    }
  }

  const records = [...prMap.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName),
  );

  return Response.json(records);
}
