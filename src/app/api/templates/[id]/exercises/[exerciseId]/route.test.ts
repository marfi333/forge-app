import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  returning: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.update.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.set.mockReturnValue(mockDb);
  mockDb.returning.mockReturnValue(mockDb);
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
  templateExercises: { templateId: "templateId", id: "id" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string, exerciseId: string) {
  return { params: Promise.resolve({ id, exerciseId }) };
}

describe("PATCH /api/templates/[id]/exercises/[exerciseId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when exercise not found", async () => {
    mockDb.where.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 with no fields provided", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = { id: "e1", templateId: "t1", name: "Bench", order: 0 };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(400);
  });

  it("updates exercise name", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = { id: "e1", templateId: "t1", name: "Bench", order: 0 };
    const updated = { ...exercise, name: "Incline Bench" };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Incline Bench" }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe("Incline Bench");
  });

  it("updates exercise description and youtubeUrl", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = {
      id: "e1",
      templateId: "t1",
      name: "Bench",
      description: null,
      youtubeUrl: null,
      order: 0,
    };
    const updated = {
      ...exercise,
      description: "Flat barbell press",
      youtubeUrl: "https://youtube.com/watch?v=abc",
    };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({
        description: "Flat barbell press",
        youtubeUrl: "https://youtube.com/watch?v=abc",
      }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      description: string;
      youtubeUrl: string;
    };
    expect(data.description).toBe("Flat barbell press");
    expect(data.youtubeUrl).toBe("https://youtube.com/watch?v=abc");
  });

  it("clears imageUrl by setting null", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = {
      id: "e1",
      templateId: "t1",
      name: "Bench",
      imageUrl: "https://example.com/old.jpg",
      order: 0,
    };
    const updated = { ...exercise, imageUrl: null };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ imageUrl: null }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { imageUrl: null };
    expect(data.imageUrl).toBeNull();
  });

  it("returns 400 with invalid youtubeUrl", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = { id: "e1", templateId: "t1", name: "Bench", order: 0 };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ youtubeUrl: "not-a-url" }),
    });
    const res = await PATCH(req, makeParams("t1", "e1"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/templates/[id]/exercises/[exerciseId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("t1", "e1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when exercise not found", async () => {
    mockDb.where.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("t1", "e1"),
    );
    expect(res.status).toBe(404);
  });

  it("deletes exercise and returns 204", async () => {
    const template = { id: "t1", userId: "user1", name: "Push" };
    const exercise = { id: "e1", templateId: "t1", name: "Bench", order: 0 };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce([exercise])
      .mockResolvedValueOnce(undefined);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("t1", "e1"),
    );
    expect(res.status).toBe(204);
  });
});
