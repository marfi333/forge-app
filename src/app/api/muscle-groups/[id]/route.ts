import { and, eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getAuthedDb, notFound, unauthorized } from "@/lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const { id } = await params;

  const [group] = await db
    .select()
    .from(schema.muscleGroups)
    .where(eq(schema.muscleGroups.id, id));

  if (!group) return notFound();

  if (group.isSystem) {
    return Response.json(
      { error: "Cannot delete system muscle groups" },
      { status: 403 },
    );
  }

  if (group.userId !== userId) return notFound();

  await db
    .delete(schema.muscleGroups)
    .where(
      and(
        eq(schema.muscleGroups.id, id),
        eq(schema.muscleGroups.userId, userId),
      ),
    );

  return new Response(null, { status: 204 });
}
