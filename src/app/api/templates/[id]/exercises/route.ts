import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const createExerciseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().trim().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  youtubeUrl: z.string().url().nullable().optional(),
  order: z.number().int().min(0).default(0),
  sets: z.number().int().min(1).nullable().optional(),
  reps: z.number().int().min(1).nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;

  const [template] = await db
    .select()
    .from(schema.workoutTemplates)
    .where(
      and(
        eq(schema.workoutTemplates.id, id),
        eq(schema.workoutTemplates.userId, userId),
      ),
    );
  if (!template) return notFound();

  const exercises = await db
    .select()
    .from(schema.templateExercises)
    .where(eq(schema.templateExercises.templateId, id))
    .orderBy(schema.templateExercises.order);

  return Response.json(exercises);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;

  const [template] = await db
    .select()
    .from(schema.workoutTemplates)
    .where(
      and(
        eq(schema.workoutTemplates.id, id),
        eq(schema.workoutTemplates.userId, userId),
      ),
    );
  if (!template) return notFound();

  const body = await request.json();
  const result = createExerciseSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [exercise] = await db
    .insert(schema.templateExercises)
    .values({
      templateId: id,
      name: result.data.name,
      description: result.data.description ?? null,
      imageUrl: result.data.imageUrl ?? null,
      youtubeUrl: result.data.youtubeUrl ?? null,
      order: result.data.order,
      sets: result.data.sets ?? null,
      reps: result.data.reps ?? null,
    })
    .returning();

  return Response.json(exercise, { status: 201 });
}
