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
  and: (...args: unknown[]) => args,
  gte: (col: unknown, val: unknown) => ({ col, val, op: "gte" }),
  lt: (col: unknown, val: unknown) => ({ col, val, op: "lt" }),
}));

vi.mock("@/db/schema", () => ({
  calendarDays: { userId: "userId", id: "id", date: "date" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/calendar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/calendar?month=2026-05"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without month param", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/calendar"));
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid month format", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/calendar?month=2026-5"),
    );
    expect(res.status).toBe(400);
  });

  it("returns calendar days for valid month", async () => {
    const days = [
      { id: "d1", userId: "user1", date: "2026-05-01", type: "workout" },
    ];
    mockDb.where.mockResolvedValue(days);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(
      new Request("http://localhost/api/calendar?month=2026-05"),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { date: string }[];
    expect(data).toHaveLength(1);
    expect(data[0].date).toBe("2026-05-01");
  });
});

describe("PUT /api/calendar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({ date: "2026-05-01", type: "workout" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid date", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({ date: "not-a-date", type: "workout" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid type", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({ date: "2026-05-01", type: "cardio" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it("creates a new calendar day", async () => {
    const created = {
      id: "d1",
      userId: "user1",
      date: "2026-05-01",
      type: "workout",
    };
    mockDb.where.mockResolvedValueOnce([]);
    mockDb.returning.mockResolvedValueOnce([created]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({ date: "2026-05-01", type: "workout" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { type: string };
    expect(data.type).toBe("workout");
  });

  it("updates an existing calendar day", async () => {
    const existing = {
      id: "d1",
      userId: "user1",
      date: "2026-05-01",
      type: "workout",
    };
    const updated = { ...existing, type: "rest" };
    mockDb.where.mockResolvedValueOnce([existing]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });

    const { PUT } = await import("./route");
    const req = new Request("http://localhost/api/calendar", {
      method: "PUT",
      body: JSON.stringify({ date: "2026-05-01", type: "rest" }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { type: string };
    expect(data.type).toBe("rest");
  });
});

describe("DELETE /api/calendar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost/api/calendar?date=2026-05-01"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 without date param", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost/api/calendar"));
    expect(res.status).toBe(400);
  });

  it("deletes a calendar day", async () => {
    mockDb.where.mockResolvedValueOnce(undefined);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost/api/calendar?date=2026-05-01"),
    );
    expect(res.status).toBe(204);
  });
});
