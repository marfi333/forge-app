import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const updateExerciseSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    description: z.string().trim().nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    youtubeUrl: z.string().url().nullable().optional(),
    order: z.number().int().min(0).optional(),
    sets: z.number().int().min(1).nullable().optional(),
    reps: z.number().int().min(1).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.imageUrl !== undefined ||
      data.youtubeUrl !== undefined ||
      data.order !== undefined ||
      data.sets !== undefined ||
      data.reps !== undefined,
    { message: "At least one field is required" },
  );

async function getOwnedExercise(
  db: NonNullable<Awaited<ReturnType<typeof getAuthedDb>>["db"]>,
  userId: string,
  templateId: string,
  exerciseId: string,
) {
  const [template] = await db
    .select()
    .from(schema.workoutTemplates)
    .where(
      and(
        eq(schema.workoutTemplates.id, templateId),
        eq(schema.workoutTemplates.userId, userId),
      ),
    );
  if (!template) return null;

  const [exercise] = await db
    .select()
    .from(schema.templateExercises)
    .where(
      and(
        eq(schema.templateExercises.id, exerciseId),
        eq(schema.templateExercises.templateId, templateId),
      ),
    );
  return exercise ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId } = await params;
  const exercise = await getOwnedExercise(db, userId, id, exerciseId);
  if (!exercise) return notFound();

  return Response.json(exercise);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId } = await params;
  const exercise = await getOwnedExercise(db, userId, id, exerciseId);
  if (!exercise) return notFound();

  const body = await request.json();
  const result = updateExerciseSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const updates: Partial<{
    name: string;
    description: string | null;
    imageUrl: string | null;
    youtubeUrl: string | null;
    order: number;
    sets: number | null;
    reps: number | null;
  }> = {};
  if (result.data.name !== undefined) updates.name = result.data.name;
  if (result.data.description !== undefined)
    updates.description = result.data.description;
  if (result.data.imageUrl !== undefined)
    updates.imageUrl = result.data.imageUrl;
  if (result.data.youtubeUrl !== undefined)
    updates.youtubeUrl = result.data.youtubeUrl;
  if (result.data.order !== undefined) updates.order = result.data.order;
  if (result.data.sets !== undefined) updates.sets = result.data.sets;
  if (result.data.reps !== undefined) updates.reps = result.data.reps;

  const [updated] = await db
    .update(schema.templateExercises)
    .set(updates)
    .where(eq(schema.templateExercises.id, exerciseId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; exerciseId: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id, exerciseId } = await params;
  const exercise = await getOwnedExercise(db, userId, id, exerciseId);
  if (!exercise) return notFound();

  await db
    .delete(schema.templateExercises)
    .where(eq(schema.templateExercises.id, exerciseId));

  return new Response(null, { status: 204 });
}
