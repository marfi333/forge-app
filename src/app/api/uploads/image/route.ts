import { getCloudflareContext } from "@opennextjs/cloudflare";
import { auth } from "@/auth";
import { badRequest, unauthorized } from "@/lib/api";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return badRequest("No file provided");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return badRequest("Invalid file type. Allowed: JPEG, PNG, WebP");
  }

  if (file.size > MAX_FILE_SIZE) {
    return badRequest("File too large. Maximum size: 5MB");
  }

  const ext =
    file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const key = `exercises/${session.user.id}/${crypto.randomUUID()}.${ext}`;

  const { env } = getCloudflareContext();
  await env.UPLOADS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `/api/uploads/image/${key}`;

  return Response.json({ url }, { status: 201 });
}
