import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  orderBy: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.update.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.set.mockReturnValue(mockDb);
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
  workoutSessions: { userId: "userId", id: "id" },
  sessionExercises: { sessionId: "sessionId", id: "id", order: "order" },
  exerciseSets: {
    sessionExerciseId: "sessionExerciseId",
    id: "id",
    setNumber: "setNumber",
  },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/sessions/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when session not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(404);
  });

  it("returns session with exercises and sets", async () => {
    const session = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      status: "in_progress",
    };
    const exercises = [{ id: "e1", sessionId: "s1", name: "Bench", order: 0 }];
    const sets = [
      {
        id: "set1",
        sessionExerciseId: "e1",
        setNumber: 1,
        reps: 10,
        weight: 60,
        completed: false,
      },
    ];
    mockDb.where.mockResolvedValueOnce([session]);
    mockDb.orderBy.mockResolvedValueOnce(exercises);
    mockDb.orderBy.mockResolvedValueOnce(sets);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      exercises: { sets: unknown[] }[];
    };
    expect(data.exercises).toHaveLength(1);
    expect(data.exercises[0].sets).toHaveLength(1);
  });
});

describe("PATCH /api/sessions/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    const res = await PATCH(req, makeParams("s1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when session not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    const res = await PATCH(req, makeParams("s1"));
    expect(res.status).toBe(404);
  });

  it("updates session status", async () => {
    const session = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      status: "in_progress",
    };
    const updated = { ...session, status: "completed" };
    mockDb.where.mockResolvedValueOnce([session]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ status: "completed" }),
    });
    const res = await PATCH(req, makeParams("s1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { status: string };
    expect(data.status).toBe("completed");
  });

  it("returns 400 with invalid status", async () => {
    const session = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      status: "in_progress",
    };
    mockDb.where.mockResolvedValueOnce([session]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ status: "invalid" }),
    });
    const res = await PATCH(req, makeParams("s1"));
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/sessions/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when session not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(404);
  });

  it("deletes session and returns 204", async () => {
    const session = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      status: "in_progress",
    };
    mockDb.where
      .mockResolvedValueOnce([session])
      .mockResolvedValueOnce(undefined);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("s1"));
    expect(res.status).toBe(204);
  });
});
