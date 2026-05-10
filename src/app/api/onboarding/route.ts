import { eq } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@/db/schema";
import { getAuthedDb, unauthorized } from "@/lib/api";

export async function GET() {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const [user] = await db
    .select({ onboardingCompletedAt: schema.users.onboardingCompletedAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  return Response.json({
    completed: user?.onboardingCompletedAt != null,
    completedAt: user?.onboardingCompletedAt?.toISOString() ?? null,
  });
}

const patchSchema = z.object({
  completed: z.boolean(),
});

export async function PATCH(request: Request) {
  const { db, userId } = await getAuthedDb();
  if (!db) return unauthorized();

  const body = await request.json();
  const result = patchSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { error: result.error.issues[0].message },
      { status: 400 },
    );
  }

  const onboardingCompletedAt = result.data.completed ? new Date() : null;

  const [updated] = await db
    .update(schema.users)
    .set({ onboardingCompletedAt })
    .where(eq(schema.users.id, userId))
    .returning({
      onboardingCompletedAt: schema.users.onboardingCompletedAt,
    });

  return Response.json({
    completed: updated.onboardingCompletedAt != null,
    completedAt: updated.onboardingCompletedAt?.toISOString() ?? null,
  });
}
