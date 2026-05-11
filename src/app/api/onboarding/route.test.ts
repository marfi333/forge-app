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
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

vi.mock("@/db/schema", () => ({
  users: {
    id: "id",
    onboardingCompletedAt: "onboarding_completed_at",
  },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns completed: false when onboardingCompletedAt is null", async () => {
    mockDb.where.mockResolvedValueOnce([{ onboardingCompletedAt: null }]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      completed: boolean;
      completedAt: string | null;
    };
    expect(data.completed).toBe(false);
    expect(data.completedAt).toBeNull();
  });

  it("returns completed: true when onboardingCompletedAt is set", async () => {
    const date = new Date("2026-05-10T10:00:00Z");
    mockDb.where.mockResolvedValueOnce([{ onboardingCompletedAt: date }]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      completed: boolean;
      completedAt: string;
    };
    expect(data.completed).toBe(true);
    expect(data.completedAt).toBe("2026-05-10T10:00:00.000Z");
  });
});

describe("PATCH /api/onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid body", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ completed: "yes" }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it("sets onboardingCompletedAt when completed: true", async () => {
    const now = new Date();
    mockDb.returning.mockResolvedValueOnce([{ onboardingCompletedAt: now }]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ completed: true }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { completed: boolean };
    expect(data.completed).toBe(true);
  });

  it("resets onboardingCompletedAt when completed: false", async () => {
    mockDb.returning.mockResolvedValueOnce([{ onboardingCompletedAt: null }]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ completed: false }),
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      completed: boolean;
      completedAt: string | null;
    };
    expect(data.completed).toBe(false);
    expect(data.completedAt).toBeNull();
  });
});
