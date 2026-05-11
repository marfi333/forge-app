import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;

  const exercise = await db
    .select()
    .from(schema.templateExercises)
    .innerJoin(
      schema.workoutTemplates,
      eq(schema.templateExercises.templateId, schema.workoutTemplates.id),
    )
    .where(eq(schema.templateExercises.id, id));

  if (!exercise.length || exercise[0].workout_templates.userId !== userId) {
    return notFound();
  }

  const groups = await db
    .select({ muscleGroup: schema.muscleGroups })
    .from(schema.exerciseMuscleGroups)
    .innerJoin(
      schema.muscleGroups,
      eq(schema.exerciseMuscleGroups.muscleGroupId, schema.muscleGroups.id),
    )
    .where(eq(schema.exerciseMuscleGroups.templateExerciseId, id));

  return Response.json(groups.map((g) => g.muscleGroup));
}

const updateSchema = z.object({
  muscleGroupIds: z.array(z.string().min(1)),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;

  const exercise = await db
    .select()
    .from(schema.templateExercises)
    .innerJoin(
      schema.workoutTemplates,
      eq(schema.templateExercises.templateId, schema.workoutTemplates.id),
    )
    .where(eq(schema.templateExercises.id, id));

  if (!exercise.length || exercise[0].workout_templates.userId !== userId) {
    return notFound();
  }

  const body = await request.json();
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  await db
    .delete(schema.exerciseMuscleGroups)
    .where(eq(schema.exerciseMuscleGroups.templateExerciseId, id));

  if (result.data.muscleGroupIds.length > 0) {
    await db.insert(schema.exerciseMuscleGroups).values(
      result.data.muscleGroupIds.map((muscleGroupId) => ({
        templateExerciseId: id,
        muscleGroupId,
      })),
    );
  }

  const groups = await db
    .select({ muscleGroup: schema.muscleGroups })
    .from(schema.exerciseMuscleGroups)
    .innerJoin(
      schema.muscleGroups,
      eq(schema.exerciseMuscleGroups.muscleGroupId, schema.muscleGroups.id),
    )
    .where(eq(schema.exerciseMuscleGroups.templateExerciseId, id));

  return Response.json(groups.map((g) => g.muscleGroup));
}
