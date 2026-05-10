import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
};

mockDb.select.mockReturnValue(mockDb);
mockDb.from.mockReturnValue(mockDb);
mockDb.where.mockReturnValue(mockDb);
mockDb.insert.mockReturnValue(mockDb);
mockDb.values.mockReturnValue(mockDb);

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

vi.mock("@/db/schema", () => ({
  workoutTemplates: { userId: "userId", id: "id" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/templates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns user templates", async () => {
    const templates = [
      { id: "1", userId: "user1", name: "Push Day", createdAt: new Date() },
    ];
    mockDb.where.mockResolvedValue(templates);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Push Day");
  });
});

describe("POST /api/templates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.insert.mockReturnValue(mockDb);
    mockDb.values.mockReturnValue(mockDb);
    mockDb.returning.mockReturnValue(mockDb);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({ name: "Push Day" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty name", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing name", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a template successfully", async () => {
    const created = {
      id: "new-id",
      userId: "user1",
      name: "Push Day",
      createdAt: new Date(),
    };
    mockDb.returning.mockResolvedValue([created]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/templates", {
      method: "POST",
      body: JSON.stringify({ name: "Push Day" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe("Push Day");
  });
});
