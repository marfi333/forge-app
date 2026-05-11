import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  values: vi.fn(),
  innerJoin: vi.fn(),
};

function chainMock() {
  mockDb.select.mockReturnValue(mockDb);
  mockDb.insert.mockReturnValue(mockDb);
  mockDb.delete.mockReturnValue(mockDb);
  mockDb.from.mockReturnValue(mockDb);
  mockDb.where.mockReturnValue(mockDb);
  mockDb.values.mockReturnValue(mockDb);
  mockDb.innerJoin.mockReturnValue(mockDb);
}

vi.mock("@/lib/api", () => ({
  getAuthedDb: vi.fn(),
  unauthorized: () => Response.json({ error: "Unauthorized" }, { status: 401 }),
  notFound: () => Response.json({ error: "Not found" }, { status: 404 }),
}));

vi.mock("drizzle-orm", () => ({
  eq: (col: unknown, val: unknown) => ({ col, val }),
}));

vi.mock("@/db/schema", () => ({
  muscleGroups: { id: "id" },
  exerciseMuscleGroups: {
    templateExerciseId: "templateExerciseId",
    muscleGroupId: "muscleGroupId",
  },
  templateExercises: { id: "id", templateId: "templateId" },
  workoutTemplates: { id: "id", userId: "userId" },
}));

import { getAuthedDb } from "@/lib/api";

const mockGetAuthedDb = vi.mocked(getAuthedDb);

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/template-exercises/[id]/muscle-groups", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("e1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when exercise not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("e1"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when exercise belongs to another user", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        template_exercises: { id: "e1", templateId: "t1" },
        workout_templates: { id: "t1", userId: "other_user" },
      },
    ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("e1"));
    expect(res.status).toBe(404);
  });

  it("returns muscle groups for exercise", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        {
          template_exercises: { id: "e1", templateId: "t1" },
          workout_templates: { id: "t1", userId: "user1" },
        },
      ])
      .mockResolvedValueOnce([
        { muscleGroup: { id: "mg_chest", name: "chest", isSystem: true } },
        { muscleGroup: { id: "mg_back", name: "back", isSystem: true } },
      ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost"), makeParams("e1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("chest");
  });
});

describe("PUT /api/template-exercises/[id]/muscle-groups", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    chainMock();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetAuthedDb.mockResolvedValue({ db: null, userId: null });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ muscleGroupIds: ["mg_chest"] }),
    });
    const res = await PUT(req, makeParams("e1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 when exercise not found", async () => {
    mockDb.where.mockResolvedValueOnce([]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ muscleGroupIds: ["mg_chest"] }),
    });
    const res = await PUT(req, makeParams("e1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 with invalid body", async () => {
    mockDb.where.mockResolvedValueOnce([
      {
        template_exercises: { id: "e1", templateId: "t1" },
        workout_templates: { id: "t1", userId: "user1" },
      },
    ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ muscleGroupIds: "not-array" }),
    });
    const res = await PUT(req, makeParams("e1"));
    expect(res.status).toBe(400);
  });

  it("replaces muscle group associations", async () => {
    mockDb.where
      .mockResolvedValueOnce([
        {
          template_exercises: { id: "e1", templateId: "t1" },
          workout_templates: { id: "t1", userId: "user1" },
        },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { muscleGroup: { id: "mg_chest", name: "chest", isSystem: true } },
      ]);
    mockGetAuthedDb.mockResolvedValue({
      db: mockDb as never,
      userId: "user1",
    });
    const { PUT } = await import("./route");
    const req = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ muscleGroupIds: ["mg_chest"] }),
    });
    const res = await PUT(req, makeParams("e1"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as { name: string }[];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("chest");
  });
});
