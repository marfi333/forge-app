import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Drizzle query builder mock: a Proxy that returns itself for any chained
// method call but acts as a Promise when awaited, resolving to the next
// queued result. Lets the test queue results in execution order regardless
// of which terminal method (where/orderBy/limit) ends each chain.

let queuedResults: unknown[] = [];
let resultIndex = 0;

function makeChain() {
  const handler: ProxyHandler<object> = {
    get(_target, prop) {
      if (prop === "then") {
        const result = queuedResults[resultIndex++];
        return Promise.resolve(result).then.bind(Promise.resolve(result));
      }
      // Any other method (select, from, where, innerJoin, orderBy, limit, etc.)
      // returns the same proxy for chaining.
      return () => proxy;
    },
  };
  const proxy: never = new Proxy({}, handler) as never;
  return proxy;
}

const mockDb = makeChain();

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  and: (...args: unknown[]) => args,
  gte: (col: unknown, val: unknown) => ({ col, val, op: "gte" }),
  lte: (col: unknown, val: unknown) => ({ col, val, op: "lte" }),
  lt: (col: unknown, val: unknown) => ({ col, val, op: "lt" }),
  ne: (col: unknown, val: unknown) => ({ col, val, op: "ne" }),
  desc: (col: unknown) => ({ col, op: "desc" }),
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
  sessionExercises: { sessionId: "sessionId", id: "id", name: "name" },
  exerciseSets: {
    sessionExerciseId: "sessionExerciseId",
    weight: "weight",
    completed: "completed",
  },
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

/**
 * Queue results for the route's queries in execution order:
 * 1. weekSessions (Promise.all)
 * 2. templates (Promise.all)
 * 3. calendarDays (Promise.all)
 * 4. recentCompletedDates
 * 5. lastCompletedSession
 * 6. (optional) last session sets (PR query)
 * 7. (optional) prior sets (PR query)
 */
function queueResults(...results: unknown[]) {
  queuedResults = results;
  resultIndex = 0;
}

type DashboardResponse = {
  weeklyPlan: {
    weekday: string;
    date: string;
    dayType: string;
    template: { id: string } | null;
    isCompleted: boolean;
  }[];
  completedCount: number;
  workoutDays: number;
  restDays: number;
  motivation: {
    daysSinceLastWorkout: number | null;
    streak: number;
    todayIsWorkout: boolean;
    recentPR: { exercise: string; weight: number } | null;
  };
};

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queuedResults = [];
    resultIndex = 0;
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T12:00:00Z")); // Monday
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
    queueResults(
      [{ id: "s1", date: "2026-05-11", status: "completed" }], // weekSessions
      [
        { id: "t1", name: "Push Day", weekday: "Monday", muscleGroup: "Chest" },
        {
          id: "t2",
          name: "Pull Day",
          weekday: "Wednesday",
          muscleGroup: "Back",
        },
      ], // templates
      [], // calendarDays
      [{ date: "2026-05-11" }], // recentCompletedDates
      [{ id: "s1", date: "2026-05-11" }], // lastCompletedSession
      [], // last session sets (no PR)
    );

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);

    const data = (await res.json()) as DashboardResponse;

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
    queueResults([], [], [{ date: "2026-05-12", type: "rest" }], [], []);

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = (await res.json()) as DashboardResponse;

    expect(data.weeklyPlan[1].dayType).toBe("rest");
    expect(data.restDays).toBe(7);
  });

  it("returns rest for days without template or calendar entry", async () => {
    queueResults([], [], [], [], []);

    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = (await res.json()) as DashboardResponse;

    for (const day of data.weeklyPlan) {
      expect(day.dayType).toBe("rest");
    }
    expect(data.restDays).toBe(7);
  });

  describe("motivation context", () => {
    it("returns null daysSinceLastWorkout and zero streak when no sessions exist", async () => {
      queueResults([], [], [], [], []);

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.daysSinceLastWorkout).toBeNull();
      expect(data.motivation.streak).toBe(0);
      expect(data.motivation.recentPR).toBeNull();
    });

    it("calculates streak for consecutive days including today", async () => {
      queueResults(
        [],
        [],
        [],
        [
          { date: "2026-05-11" },
          { date: "2026-05-10" },
          { date: "2026-05-09" },
        ],
        [{ id: "s1", date: "2026-05-11" }],
        [], // no exercises in last session
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.streak).toBe(3);
      expect(data.motivation.daysSinceLastWorkout).toBe(0);
    });

    it("calculates streak ending yesterday when today not completed", async () => {
      queueResults(
        [],
        [],
        [],
        [{ date: "2026-05-10" }, { date: "2026-05-09" }],
        [{ id: "s1", date: "2026-05-10" }],
        [],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.streak).toBe(2);
      expect(data.motivation.daysSinceLastWorkout).toBe(1);
    });

    it("breaks streak on a missing day", async () => {
      queueResults(
        [],
        [],
        [],
        [{ date: "2026-05-11" }, { date: "2026-05-09" }],
        [{ id: "s1", date: "2026-05-11" }],
        [],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.streak).toBe(1);
    });

    it("flags todayIsWorkout when template assigned to today", async () => {
      queueResults(
        [],
        [{ id: "t1", name: "Push", weekday: "Monday", muscleGroup: "Chest" }],
        [],
        [],
        [],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.todayIsWorkout).toBe(true);
    });

    it("flags todayIsWorkout false on rest day", async () => {
      queueResults([], [], [], [], []);

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.todayIsWorkout).toBe(false);
    });

    it("returns recentPR when last session beats prior max for an exercise", async () => {
      queueResults(
        [],
        [],
        [],
        [{ date: "2026-05-11" }],
        [{ id: "s-latest", date: "2026-05-11" }],
        [
          { exerciseName: "Bench Press", weight: 100 },
          { exerciseName: "Bench Press", weight: 105 },
          { exerciseName: "Squat", weight: 120 },
        ],
        [
          { exerciseName: "Bench Press", weight: 95 },
          { exerciseName: "Squat", weight: 130 },
        ],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.recentPR).toEqual({
        exercise: "Bench Press",
        weight: 105,
      });
    });

    it("returns null recentPR when no exercise beats prior max", async () => {
      queueResults(
        [],
        [],
        [],
        [{ date: "2026-05-11" }],
        [{ id: "s-latest", date: "2026-05-11" }],
        [{ exerciseName: "Bench Press", weight: 80 }],
        [{ exerciseName: "Bench Press", weight: 100 }],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.recentPR).toBeNull();
    });

    it("returns recentPR as a fresh PR when there is no prior session for that exercise", async () => {
      queueResults(
        [],
        [],
        [],
        [{ date: "2026-05-11" }],
        [{ id: "s-latest", date: "2026-05-11" }],
        [{ exerciseName: "Deadlift", weight: 140 }],
        [],
      );

      mockGetAuthedDb.mockResolvedValue({
        db: mockDb as never,
        userId: "user1",
      });

      const { GET } = await import("./route");
      const res = await GET();
      const data = (await res.json()) as DashboardResponse;

      expect(data.motivation.recentPR).toEqual({
        exercise: "Deadlift",
        weight: 140,
      });
    });
  });
});
