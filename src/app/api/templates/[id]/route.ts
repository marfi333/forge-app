import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";
import { MUSCLE_GROUPS, WEEKDAYS } from "@/lib/constants";

const updateTemplateSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    weekday: z.enum(WEEKDAYS).nullable().optional(),
    muscleGroup: z.enum(MUSCLE_GROUPS).nullable().optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.weekday !== undefined ||
      data.muscleGroup !== undefined,
    { message: "At least one field is required" },
  );

async function getOwnedTemplate(
  db: NonNullable<Awaited<ReturnType<typeof getAuthedDb>>["db"]>,
  userId: string,
  id: string,
) {
  const [template] = await db
    .select()
    .from(schema.workoutTemplates)
    .where(
      and(
        eq(schema.workoutTemplates.id, id),
        eq(schema.workoutTemplates.userId, userId),
      ),
    );
  return template ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const template = await getOwnedTemplate(db, userId, id);
  if (!template) return notFound();

  const exercises = await db
    .select()
    .from(schema.templateExercises)
    .where(eq(schema.templateExercises.templateId, id))
    .orderBy(schema.templateExercises.order);

  return Response.json({ ...template, exercises });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const template = await getOwnedTemplate(db, userId, id);
  if (!template) return notFound();

  const body = await request.json();
  const result = updateTemplateSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const updates: Partial<{
    name: string;
    weekday: string | null;
    muscleGroup: string | null;
  }> = {};
  if (result.data.name !== undefined) updates.name = result.data.name;
  if (result.data.weekday !== undefined) updates.weekday = result.data.weekday;
  if (result.data.muscleGroup !== undefined)
    updates.muscleGroup = result.data.muscleGroup;

  const [updated] = await db
    .update(schema.workoutTemplates)
    .set(updates)
    .where(eq(schema.workoutTemplates.id, id))
    .returning();

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;
  const template = await getOwnedTemplate(db, userId, id);
  if (!template) return notFound();

  await db
    .delete(schema.workoutTemplates)
    .where(eq(schema.workoutTemplates.id, id));

  return new Response(null, { status: 204 });
}
