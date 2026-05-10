import { describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => ({ type: "next" }),
    redirect: (url: URL) => ({ type: "redirect", url: url.toString() }),
  },
}));

function createRequest(
  url: string,
  sessionToken?: string,
): {
  nextUrl: URL;
  cookies: { get: (name: string) => { value: string } | undefined };
} {
  return {
    nextUrl: new URL(url),
    cookies: {
      get: (name: string) =>
        name === "authjs.session-token" && sessionToken
          ? { value: sessionToken }
          : undefined,
    },
  };
}

describe("middleware", () => {
  async function loadMiddleware() {
    const mod = await import("./middleware");
    return mod.middleware as unknown as (
      req: ReturnType<typeof createRequest>,
    ) => {
      type: string;
      url?: string;
    };
  }

  it("allows access to /sign-in without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(createRequest("http://localhost:3000/sign-in"));
    expect(res).toEqual({ type: "next" });
  });

  it("allows access to /api/auth routes without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(
      createRequest("http://localhost:3000/api/auth/callback/google"),
    );
    expect(res).toEqual({ type: "next" });
  });

  it("allows access to /offline without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(createRequest("http://localhost:3000/offline"));
    expect(res).toEqual({ type: "next" });
  });

  it("redirects unauthenticated users to /sign-in", async () => {
    const mw = await loadMiddleware();
    const res = mw(createRequest("http://localhost:3000/dashboard"));
    expect(res.type).toBe("redirect");
    expect(res.url).toContain("/sign-in");
  });

  it("allows authenticated users to access protected routes", async () => {
    const mw = await loadMiddleware();
    const res = mw(
      createRequest("http://localhost:3000/dashboard", "valid-session-token"),
    );
    expect(res).toEqual({ type: "next" });
  });
});
