import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const updateExerciseSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    order: z.number().int().min(0).optional(),
  })
  .refine((data) => data.name || data.order !== undefined, {
    message: "At least one field (name or order) is required",
  });

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

  const updates: Partial<{ name: string; order: number }> = {};
  if (result.data.name) updates.name = result.data.name;
  if (result.data.order !== undefined) updates.order = result.data.order;

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
