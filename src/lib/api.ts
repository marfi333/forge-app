import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { createDb } from "@/db";

export async function getAuthedDb() {
  const session = await auth();
  if (!session?.user?.id) {
    return { db: null, userId: null } as const;
  }

  const { env } = getCloudflareContext();
  const db = createDb(env.DB);
  return { db, userId: session.user.id } as const;
}

export function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

export function notFound() {
  return Response.json({ error: "Not found" }, { status: 404 });
}
