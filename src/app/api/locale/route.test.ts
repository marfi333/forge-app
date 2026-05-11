import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
};

function chainMock() {
  mockDb.update.mockReturnValue(mockDb);
  mockDb.set.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

vi.mock("@/db/schema", () => ({
  users: { id: "id", locale: "locale" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

describe("PATCH /api/locale", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      new Request("http://localhost/api/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "hu" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("updates locale and sets cookie for valid locale", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user-1",
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      new Request("http://localhost/api/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "hu" }),
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { locale: string };
    expect(body.locale).toBe("hu");
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.set).toHaveBeenCalledWith({ locale: "hu" });
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("NEXT_LOCALE=hu");
  });

  it("returns 400 for invalid locale", async () => {
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user-1",
    });
    const { PATCH } = await import("./route");
    const res = await PATCH(
      new Request("http://localhost/api/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: "fr" }),
      }),
    );
    expect(res.status).toBe(400);
  });
});
