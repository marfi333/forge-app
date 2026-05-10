import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => args,
  gte: (col: unknown, val: unknown) => ({ col, val, op: "gte" }),
  lte: (col: unknown, val: unknown) => ({ col, val, op: "lte" }),
}));

vi.mock("@/db/schema", () => ({
  workoutSessions: {
    userId: "userId",
    id: "id",
    date: "date",
    status: "status",
  },
  workoutTemplates: {
    userId: "userId",
    id: "id",
    name: "name",
    weekday: "weekday",
    muscleGroup: "muscleGroup",
  },
  calendarDays: { userId: "userId", date: "date", type: "type" },
}));

vi.mock("@/lib/constants", () => ({
  WEEKDAYS: [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T12:00:00Z")); // Sunday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns weekly plan with template-assigned days", async () => {
    const weekSessions = [
      { id: "s1", date: "2026-05-11", status: "completed" },
    ];
    const templates = [
      { id: "t1", name: "Push Day", weekday: "Monday", muscleGroup: "Chest" },
      { id: "t2", name: "Pull Day", weekday: "Wednesday", muscleGroup: "Back" },
    ];
    const calendarDays: { date: string; type: string }[] = [];

    mockDb.where
      .mockResolvedValueOnce(weekSessions)
      .mockResolvedValueOnce(templates)
      .mockResolvedValueOnce(calendarDays);

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      weeklyPlan: {
        weekday: string;
        dayType: string;
        template: { id: string } | null;
        isCompleted: boolean;
      }[];
      completedCount: number;
      workoutDays: number;
      restDays: number;
    };

    expect(data.weeklyPlan).toHaveLength(7);
    expect(data.weeklyPlan[0].weekday).toBe("Monday");
    expect(data.weeklyPlan[0].dayType).toBe("workout");
    expect(data.weeklyPlan[0].template?.id).toBe("t1");
    expect(data.weeklyPlan[0].isCompleted).toBe(true);
    expect(data.weeklyPlan[2].dayType).toBe("workout");
    expect(data.weeklyPlan[2].template?.id).toBe("t2");
    expect(data.completedCount).toBe(1);
    expect(data.workoutDays).toBe(2);
    expect(data.restDays).toBe(5);
  });

  it("returns rest days from calendar entries", async () => {
    mockDb.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ date: "2026-05-12", type: "rest" }]);

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = (await res.json()) as {
      weeklyPlan: { weekday: string; dayType: string }[];
      restDays: number;
    };

    expect(data.weeklyPlan[1].dayType).toBe("rest");
    expect(data.restDays).toBe(7);
  });

  it("returns rest for days without template or calendar entry", async () => {
    mockDb.where
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = (await res.json()) as {
      weeklyPlan: { dayType: string }[];
      restDays: number;
    };

    for (const day of data.weeklyPlan) {
      expect(day.dayType).toBe("rest");
    }
    expect(data.restDays).toBe(7);
  });
});
