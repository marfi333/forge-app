import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPut = vi.fn();

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({
    env: {
      UPLOADS: { put: mockPut },
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  badRequest: (msg: string) => Response.json({ error: msg }, { status: 400 }),
}));

import { auth } from "@/auth";

const mockAuth = vi.mocked(auth) as unknown as ReturnType<
  typeof vi.fn<() => Promise<{ user: { id: string } } | null>>
>;

function makeFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

function makeRequest(file: File): Request {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/uploads/image", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/uploads/image", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockPut.mockResolvedValue(undefined);
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { POST } = await import("./route");
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no file provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/uploads/image", {
      method: "POST",
      body: new FormData(),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toBe("No file provided");
  });

  it("returns 400 for invalid file type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const file = makeFile("doc.pdf", "application/pdf", 1024);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("Invalid file type");
  });

  it("returns 400 for file exceeding 5MB", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const file = makeFile("large.jpg", "image/jpeg", 6 * 1024 * 1024);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: string };
    expect(data.error).toContain("File too large");
  });

  it("uploads JPEG and returns URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const file = makeFile("photo.jpg", "image/jpeg", 1024);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { url: string };
    expect(data.url).toMatch(
      /^\/api\/uploads\/image\/exercises\/user1\/.+\.jpg$/,
    );
    expect(mockPut).toHaveBeenCalledOnce();
  });

  it("uploads PNG and returns URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const file = makeFile("photo.png", "image/png", 2048);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { url: string };
    expect(data.url).toMatch(/\.png$/);
  });

  it("uploads WebP and returns URL", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } });
    const { POST } = await import("./route");
    const file = makeFile("photo.webp", "image/webp", 512);
    const res = await POST(makeRequest(file));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { url: string };
    expect(data.url).toMatch(/\.webp$/);
  });
});
