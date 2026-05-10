import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.orderBy.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  badRequest: (msg: string) => Response.json({ error: msg }, { status: 400 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => args,
}));

vi.mock("@/db/schema", () => ({
  workoutSessions: {
    id: "id",
    userId: "userId",
    date: "date",
    status: "status",
  },
  sessionExercises: {
    id: "id",
    sessionId: "sessionId",
    name: "name",
  },
  exerciseSets: {
    id: "id",
    sessionExerciseId: "sessionExerciseId",
    completed: "completed",
  },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

const sessions = [
  { id: "s1", userId: "user1", date: "2026-05-01", status: "completed" },
  { id: "s2", userId: "user1", date: "2026-05-08", status: "completed" },
];

const exercises = [
  { id: "e1", sessionId: "s1", name: "Bench Press", order: 0 },
  { id: "e2", sessionId: "s2", name: "Bench Press", order: 0 },
  { id: "e3", sessionId: "s1", name: "Squat", order: 1 },
];

const sets = [
  {
    id: "set1",
    sessionExerciseId: "e1",
    setNumber: 1,
    reps: 10,
    weight: 60,
    completed: true,
  },
  {
    id: "set2",
    sessionExerciseId: "e1",
    setNumber: 2,
    reps: 8,
    weight: 70,
    completed: true,
  },
  {
    id: "set3",
    sessionExerciseId: "e2",
    setNumber: 1,
    reps: 10,
    weight: 80,
    completed: true,
  },
  {
    id: "set4",
    sessionExerciseId: "e3",
    setNumber: 1,
    reps: 5,
    weight: 100,
    completed: true,
  },
];

function setupAuthed() {
  mockGetAuthedDb.mockResolvedValue({
    db: mockDb as never,
    userId: "user1",
  });
}

describe("GET /api/stats/exercise-history", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./exercise-history/route");
    const res = await GET(
      new Request("http://localhost/api/stats/exercise-history?name=Bench"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without name param", async () => {
    setupAuthed();
    const { GET } = await import("./exercise-history/route");
    const res = await GET(
      new Request("http://localhost/api/stats/exercise-history"),
    );
    expect(res.status).toBe(400);
  });

  it("returns empty array when no sessions", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce([]);
    const { GET } = await import("./exercise-history/route");
    const res = await GET(
      new Request("http://localhost/api/stats/exercise-history?name=Bench"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns exercise history with best weight and volume", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce(
      sessions.map((s) => ({ sessionId: s.id, date: s.date })),
    );
    mockDb.where.mockResolvedValueOnce(
      exercises.filter((e) => e.name === "Bench Press"),
    );
    mockDb.where.mockResolvedValueOnce(sets.filter((s) => s.completed));

    const { GET } = await import("./exercise-history/route");
    const res = await GET(
      new Request(
        "http://localhost/api/stats/exercise-history?name=Bench%20Press",
      ),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      date: string;
      bestWeight: number;
      totalVolume: number;
    }[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/stats/personal-records", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./personal-records/route");
    const res = await GET(
      new Request("http://localhost/api/stats/personal-records"),
    );
    expect(res.status).toBe(401);
  });

  it("returns empty array when no sessions", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce([]);
    const { GET } = await import("./personal-records/route");
    const res = await GET(
      new Request("http://localhost/api/stats/personal-records"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns personal records sorted by exercise name", async () => {
    setupAuthed();
    mockDb.where
      .mockResolvedValueOnce(
        sessions.map((s) => ({ sessionId: s.id, date: s.date })),
      )
      .mockResolvedValueOnce(sets.filter((s) => s.completed));
    mockDb.from
      .mockReturnValueOnce(mockDb)
      .mockResolvedValueOnce(exercises)
      .mockReturnValueOnce(mockDb);

    const { GET } = await import("./personal-records/route");
    const res = await GET(
      new Request("http://localhost/api/stats/personal-records"),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      exerciseName: string;
      maxWeight: number;
    }[];
    expect(data.length).toBeGreaterThanOrEqual(1);
    const names = data.map((d) => d.exerciseName);
    expect(names).toEqual([...names].sort());
  });
});

describe("GET /api/stats/volume", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./volume/route");
    const res = await GET(
      new Request("http://localhost/api/stats/volume?period=session"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid period", async () => {
    setupAuthed();
    const { GET } = await import("./volume/route");
    const res = await GET(
      new Request("http://localhost/api/stats/volume?period=month"),
    );
    expect(res.status).toBe(400);
  });

  it("returns empty array when no sessions", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce([]);
    const { GET } = await import("./volume/route");
    const res = await GET(
      new Request("http://localhost/api/stats/volume?period=session"),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns session volume data", async () => {
    setupAuthed();
    mockDb.where
      .mockResolvedValueOnce(
        sessions.map((s) => ({ sessionId: s.id, date: s.date })),
      )
      .mockResolvedValueOnce(sets.filter((s) => s.completed));
    mockDb.from
      .mockReturnValueOnce(mockDb)
      .mockResolvedValueOnce(exercises)
      .mockReturnValueOnce(mockDb);

    const { GET } = await import("./volume/route");
    const res = await GET(
      new Request("http://localhost/api/stats/volume?period=session"),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { date: string; volume: number }[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });

  it("returns weekly volume data", async () => {
    setupAuthed();
    mockDb.where
      .mockResolvedValueOnce(
        sessions.map((s) => ({ sessionId: s.id, date: s.date })),
      )
      .mockResolvedValueOnce(sets.filter((s) => s.completed));
    mockDb.from
      .mockReturnValueOnce(mockDb)
      .mockResolvedValueOnce(exercises)
      .mockReturnValueOnce(mockDb);

    const { GET } = await import("./volume/route");
    const res = await GET(
      new Request("http://localhost/api/stats/volume?period=week"),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      weekStart: string;
      volume: number;
      sessionCount: number;
    }[];
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/stats/exercises", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./exercises/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when no sessions", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce([]);
    const { GET } = await import("./exercises/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns distinct sorted exercise names", async () => {
    setupAuthed();
    mockDb.where.mockResolvedValueOnce(
      sessions.map((s) => ({ sessionId: s.id })),
    );
    mockDb.from.mockReturnValueOnce(mockDb).mockResolvedValueOnce(exercises);

    const { GET } = await import("./exercises/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as string[];
    expect(data).toEqual(["Bench Press", "Squat"]);
  });
});
