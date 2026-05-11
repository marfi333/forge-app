import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  from: vi.fn(),
  leftJoin: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
  orderBy: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.leftJoin.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.values.mockReturnValue(mockDb);
  mockDb.returning.mockReturnValue(mockDb);
  mockDb.orderBy.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => args,
  like: (col: unknown, val: unknown) => ({ col, val, op: "like" }),
}));

vi.mock("@/db/schema", () => ({
  workoutSessions: {
    userId: "userId",
    id: "id",
    date: "date",
    templateId: "templateId",
    status: "status",
    notes: "notes",
    createdAt: "createdAt",
  },
  workoutTemplates: { id: "id", name: "name" },
  templateExercises: {
    templateId: "templateId",
    id: "id",
    order: "order",
    sets: "sets",
    reps: "reps",
  },
  sessionExercises: { sessionId: "sessionId", id: "id" },
  exerciseSets: { sessionExerciseId: "sessionExerciseId", id: "id" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/sessions"));
    expect(res.status).toBe(401);
  });

  it("returns sessions", async () => {
    const sessions = [
      {
        id: "s1",
        userId: "user1",
        date: "2026-05-10",
        status: "in_progress",
      },
    ];
    mockDb.where.mockResolvedValue(sessions);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/sessions"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { id: string }[];
    expect(data).toHaveLength(1);
  });

  it("filters sessions by date", async () => {
    mockDb.where.mockResolvedValue([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/sessions?date=2026-05-10"),
    );
    expect(res.status).toBe(200);
  });
});

describe("POST /api/sessions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-10" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid date", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ date: "bad-date" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a session without template", async () => {
    const created = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      status: "in_progress",
    };
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-10" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { date: string };
    expect(data.date).toBe("2026-05-10");
  });

  it("creates a session from template and copies exercises", async () => {
    const created = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      templateId: "t1",
      status: "in_progress",
    };
    const templateExercises = [
      {
        id: "te1",
        templateId: "t1",
        name: "Bench Press",
        order: 0,
        sets: null,
        reps: null,
      },
      {
        id: "te2",
        templateId: "t1",
        name: "Squat",
        order: 1,
        sets: null,
        reps: null,
      },
    ];
    mockDb.returning
      .mockResolvedValueOnce([created])
      .mockResolvedValueOnce([
        { id: "se1", sessionId: "s1", name: "Bench Press", order: 0 },
      ])
      .mockResolvedValueOnce([
        { id: "se2", sessionId: "s1", name: "Squat", order: 1 },
      ]);
    mockDb.orderBy.mockResolvedValueOnce(templateExercises);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-10", templateId: "t1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(mockDb.insert).toHaveBeenCalledTimes(3);
  });

  it("auto-creates exercise_sets rows when template has sets defined", async () => {
    const created = {
      id: "s1",
      userId: "user1",
      date: "2026-05-10",
      templateId: "t1",
      status: "in_progress",
    };
    const templateExercises = [
      {
        id: "te1",
        templateId: "t1",
        name: "Bench Press",
        order: 0,
        sets: 3,
        reps: 10,
      },
      {
        id: "te2",
        templateId: "t1",
        name: "Squat",
        order: 1,
        sets: null,
        reps: null,
      },
    ];
    mockDb.returning
      .mockResolvedValueOnce([created])
      .mockResolvedValueOnce([
        { id: "se1", sessionId: "s1", name: "Bench Press", order: 0 },
      ])
      .mockResolvedValueOnce([
        { id: "se2", sessionId: "s1", name: "Squat", order: 1 },
      ]);
    mockDb.orderBy.mockResolvedValueOnce(templateExercises);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/sessions", {
      method: "POST",
      body: JSON.stringify({ date: "2026-05-10", templateId: "t1" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    // 1 session + 2 session exercises + 3 exercise sets = 6 inserts
    expect(mockDb.insert).toHaveBeenCalledTimes(6);
  });
});
