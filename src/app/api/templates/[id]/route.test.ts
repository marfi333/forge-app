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
  workoutTemplates: { userId: "userId", id: "id" },
  templateExercises: { templateId: "templateId", id: "id", order: "order" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/templates/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(404);
  });

  it("returns template with exercises", async () => {
    const template = {
      id: "t1",
      userId: "user1",
      name: "Push",
      createdAt: new Date(),
    };
    const exercises = [{ id: "e1", templateId: "t1", name: "Bench", order: 0 }];
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.orderBy.mockResolvedValueOnce(exercises);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string; exercises: unknown[] };
    expect(data.name).toBe("Push");
    expect(data.exercises).toEqual(exercises);
  });
});

describe("PATCH /api/templates/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req, makeParams("t1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not owned", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req, makeParams("t1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 with empty name", async () => {
    const template = {
      id: "t1",
      userId: "user1",
      name: "Push",
      createdAt: new Date(),
    };
    mockDb.where.mockResolvedValueOnce([template]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "" }),
    });
    const res = await PATCH(req, makeParams("t1"));
    expect(res.status).toBe(400);
  });

  it("updates template name", async () => {
    const template = {
      id: "t1",
      userId: "user1",
      name: "Push",
      createdAt: new Date(),
    };
    const updated = { ...template, name: "Pull" };
    mockDb.where.mockResolvedValueOnce([template]);
    mockDb.returning.mockResolvedValueOnce([updated]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ name: "Pull" }),
    });
    const res = await PATCH(req, makeParams("t1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string };
    expect(data.name).toBe("Pull");
  });
});

describe("DELETE /api/templates/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when template not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });
    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(404);
  });

  it("deletes template and returns 204", async () => {
    const template = {
      id: "t1",
      userId: "user1",
      name: "Push",
      createdAt: new Date(),
    };
    mockDb.where
      .mockResolvedValueOnce([template])
      .mockResolvedValueOnce(undefined);
    mockGetAuthedDb.mockResolvedValue({ db: mockDb as never, userId: "user1" });

    const { DELETE } = await import("./route");
    const res = await DELETE(new Request("http://localhost"), makeParams("t1"));
    expect(res.status).toBe(204);
  });
});
