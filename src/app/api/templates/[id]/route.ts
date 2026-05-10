import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const updateTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

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

  const [updated] = await db
    .update(schema.workoutTemplates)
    .set({ name: result.data.name })
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
