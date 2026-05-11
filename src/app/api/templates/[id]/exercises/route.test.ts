import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  orderBy: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.values.mockReturnValue(mockDb);
  mockDb.returning.mockReturnValue(mockDb);
  mockDb.orderBy.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  notFound: () => Response.json({ error: "Not found" }, { status: 404 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => args,
}));

vi.mock("@/db/schema", () => ({
  workoutTemplates: { userId: "userId", id: "id" },
  templateExercises: {
    templateId: "templateId",
    id: "id",
    order: "order",
    sets: "sets",
    reps: "reps",
  },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/templates/[id]/exercises", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(404);
  });

  it("returns exercises for template", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercises = [
      {
        id: "e1",
        templateId: "t1",
        name: "Bench Press",
        description: "Flat bench",
        imageUrl: null,
        youtubeUrl: null,
        order: 0,
      },
    ];
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.orderBy.mockResolvedValueOnce(exercises);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Bench Press");
  });
});

describe("POST /api/templates/[id]/exercises", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench Press" }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench Press" }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 with empty name", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    mockDb.where.mockResolvedValueOnce([template]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(400);
  });

  it("creates exercise with name only", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const created = {
      id: "e1",
      templateId: "t1",
      name: "Bench Press",
      description: null,
      imageUrl: null,
      youtubeUrl: null,
      order: 0,
    };
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench Press" }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { name: string; description: null };
    expect(data.name).toBe("Bench Press");
    expect(data.description).toBeNull();
  });

  it("creates exercise with description, imageUrl, and youtubeUrl", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const created = {
      id: "e1",
      templateId: "t1",
      name: "Bench Press",
      description: "Flat barbell bench press",
      imageUrl: "https://example.com/bench.jpg",
      youtubeUrl: "https://youtube.com/watch?v=abc123",
      order: 0,
    };
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({
        name: "Bench Press",
        description: "Flat barbell bench press",
        imageUrl: "https://example.com/bench.jpg",
        youtubeUrl: "https://youtube.com/watch?v=abc123",
      }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(201);
    const data = (await res.json()) as {
      description: string;
      imageUrl: string;
      youtubeUrl: string;
    };
    expect(data.description).toBe("Flat barbell bench press");
    expect(data.imageUrl).toBe("https://example.com/bench.jpg");
    expect(data.youtubeUrl).toBe("https://youtube.com/watch?v=abc123");
  });

  it("returns 400 with invalid imageUrl", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    mockDb.where.mockResolvedValueOnce([template]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench", imageUrl: "not-a-url" }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(400);
  });

  it("creates exercise with sets and reps", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const created = {
      id: "e1",
      templateId: "t1",
      name: "Bench Press",
      description: null,
      imageUrl: null,
      youtubeUrl: null,
      order: 0,
      sets: 3,
      reps: 10,
    };
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench Press", sets: 3, reps: 10 }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { sets: number; reps: number };
    expect(data.sets).toBe(3);
    expect(data.reps).toBe(10);
  });

  it("creates exercise with null sets and reps", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const created = {
      id: "e1",
      templateId: "t1",
      name: "Bench Press",
      description: null,
      imageUrl: null,
      youtubeUrl: null,
      order: 0,
      sets: null,
      reps: null,
    };
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench Press", sets: null, reps: null }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(201);
    const data = (await res.json()) as { sets: null; reps: null };
    expect(data.sets).toBeNull();
    expect(data.reps).toBeNull();
  });

  it("returns 400 with invalid sets value", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    mockDb.where.mockResolvedValueOnce([template]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { POST } = await import("./route");
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "Bench", sets: 0 }),
    });
    const res = await POST(req, makeParams("t1"));
    expect(res.status).toBe(400);
  });
});
