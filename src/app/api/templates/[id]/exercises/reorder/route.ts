import { and, eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

const reorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export async function PUT(
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
  const result = reorderSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  for (let i = 0; i < result.data.orderedIds.length; i++) {
    await db
      .update(schema.templateExercises)
      .set({ order: i })
      .where(
        and(
          eq(schema.templateExercises.id, result.data.orderedIds[i]),
          eq(schema.templateExercises.templateId, id),
        ),
      );
  }

  const exercises = await db
    .select()
    .from(schema.templateExercises)
    .where(eq(schema.templateExercises.templateId, id))
    .orderBy(schema.templateExercises.order);

  return Response.json(exercises);
}
