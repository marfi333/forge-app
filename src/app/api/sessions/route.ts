import { and, eq, like } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  templateId: z.string().min(1).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  const conditions = [eq(schema.workoutSessions.userId, userId)];
  if (date) {
    conditions.push(eq(schema.workoutSessions.date, date));
  } else if (month) {
    conditions.push(like(schema.workoutSessions.date, `${month}%`));
  }

  const sessions = await db
    .select({
      id: schema.workoutSessions.id,
      userId: schema.workoutSessions.userId,
      date: schema.workoutSessions.date,
      templateId: schema.workoutSessions.templateId,
      status: schema.workoutSessions.status,
      notes: schema.workoutSessions.notes,
      createdAt: schema.workoutSessions.createdAt,
      templateName: schema.workoutTemplates.name,
    })
    .from(schema.workoutSessions)
    .leftJoin(
      schema.workoutTemplates,
      eq(schema.workoutSessions.templateId, schema.workoutTemplates.id),
    )
    .where(and(...conditions));

  return Response.json(sessions);
}

export async function POST(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const result = createSessionSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const [session] = await db
    .insert(schema.workoutSessions)
    .values({
      userId,
      date: result.data.date,
      templateId: result.data.templateId,
      notes: result.data.notes,
    })
    .returning();

  if (result.data.templateId) {
    const templateExercises = await db
      .select()
      .from(schema.templateExercises)
      .where(eq(schema.templateExercises.templateId, result.data.templateId))
      .orderBy(schema.templateExercises.order);

    for (const exercise of templateExercises) {
      await db.insert(schema.sessionExercises).values({
        sessionId: session.id,
        name: exercise.name,
        order: exercise.order,
      });
    }
  }

  return Response.json(session, { status: 201 });
}
