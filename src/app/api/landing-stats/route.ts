import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sql } from "drizzle-orm";
import { createDb } from "@/db";
import { sessionExercises, users, workoutSessions } from "@/db/schema";

export async function GET() {
  const { env } = getCloudflareContext();
  const db = createDb(env.DB);

  const [workoutsResult, usersResult, exercisesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(workoutSessions),
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(sessionExercises),
  ]);

  return Response.json({
    totalWorkouts: workoutsResult[0]?.count ?? 0,
    totalUsers: usersResult[0]?.count ?? 0,
    totalExercises: exercisesResult[0]?.count ?? 0,
  });
}
