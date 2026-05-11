import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.values.mockReturnValue(mockDb);
  mockDb.returning.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
  or: (...args: unknown[]) => args,
}));

vi.mock("@/db/schema", () => ({
  muscleGroups: {
    id: "id",
    userId: "userId",
    name: "name",
    isSystem: "isSystem",
  },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("GET /api/muscle-groups", () => {
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

  it("returns muscle groups for the user", async () => {
    const groups = [
      { id: "mg_chest", userId: null, name: "chest", isSystem: true },
      { id: "custom1", userId: "user1", name: "traps", isSystem: false },
    ];
    mockDb.where.mockResolvedValue(groups);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("chest");
  });
});

describe("POST /api/muscle-groups", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/muscle-groups", {
      method: "POST",
      body: JSON.stringify({ name: "Traps" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 with empty name", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/muscle-groups", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing name", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/muscle-groups", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a custom muscle group", async () => {
    const created = {
      id: "new1",
      userId: "user1",
      name: "Traps",
      isSystem: false,
    };
    mockDb.returning.mockResolvedValue([created]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/muscle-groups", {
      method: "POST",
      body: JSON.stringify({ name: "Traps" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = (await res.json()) as { name: string; isSystem: boolean };
    expect(data.name).toBe("Traps");
    expect(data.isSystem).toBe(false);
  });
});
