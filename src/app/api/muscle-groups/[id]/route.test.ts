import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
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
  muscleGroups: { id: "id", userId: "userId", isSystem: "isSystem" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/muscle-groups/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("mg1"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when muscle group not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("mg1"),
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 for system muscle groups", async () => {
    mockDb.where.mockResolvedValueOnce([
      { id: "mg_chest", userId: null, name: "chest", isSystem: true },
    ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("mg_chest"),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when user does not own the group", async () => {
    mockDb.where.mockResolvedValueOnce([
      { id: "mg1", userId: "other_user", name: "traps", isSystem: false },
    ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("mg1"),
    );
    expect(res.status).toBe(404);
  });

  it("deletes a custom muscle group and returns 204", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        { id: "mg1", userId: "user1", name: "traps", isSystem: false },
      ])
      .mockResolvedValueOnce(undefined);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { DELETE } = await import("./route");
    const res = await DELETE(
      new Request("http://localhost"),
      makeParams("mg1"),
    );
    expect(res.status).toBe(204);
  });
});
