import { and, eq, gte, lt } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

const upsertDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  type: z.enum(["workout", "rest"]),
});

export async function GET(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return Response.json(
      { error: "month query param required (YYYY-MM)" },
      { status: 400 },
    );
  }

  const startDate = `${month}-01`;
  const [year, mon] = month.split("-").map(Number);
  const nextMonth =
    mon === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(mon + 1).padStart(2, "0")}-01`;

  const days = await db
    .select()
    .from(schema.calendarDays)
    .where(
      and(
        eq(schema.calendarDays.userId, userId),
        gte(schema.calendarDays.date, startDate),
        lt(schema.calendarDays.date, nextMonth),
      ),
    );

  return Response.json(days);
}

export async function PUT(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const result = upsertDaySchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(schema.calendarDays)
    .where(
      and(
        eq(schema.calendarDays.userId, userId),
        eq(schema.calendarDays.date, result.data.date),
      ),
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.calendarDays)
      .set({ type: result.data.type })
      .where(eq(schema.calendarDays.id, existing[0].id))
      .returning();
    return Response.json(updated);
  }

  const [created] = await db
    .insert(schema.calendarDays)
    .values({ userId, date: result.data.date, type: result.data.type })
    .returning();

  return Response.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "date query param required (YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  await db
    .delete(schema.calendarDays)
    .where(
      and(
        eq(schema.calendarDays.userId, userId),
        eq(schema.calendarDays.date, date),
      ),
    );

  return new Response(null, { status: 204 });
}
