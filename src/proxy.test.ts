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

describe("proxy", () => {
  async function loadProxy() {
    const mod = await import("./proxy");
    return mod.proxy as unknown as (req: ReturnType<typeof createRequest>) => {
      type: string;
      url?: string;
    };
  }

  it("allows access to /sign-in without auth", async () => {
    const proxyFn = await loadProxy();
    const res = proxyFn(createRequest("http://localhost:3000/sign-in"));
    expect(res).toEqual({ type: "next" });
  });

  it("allows access to /api/auth routes without auth", async () => {
    const proxyFn = await loadProxy();
    const res = proxyFn(
      createRequest("http://localhost:3000/api/auth/callback/google"),
    );
    expect(res).toEqual({ type: "next" });
  });

  it("allows access to /offline without auth", async () => {
    const proxyFn = await loadProxy();
    const res = proxyFn(createRequest("http://localhost:3000/offline"));
    expect(res).toEqual({ type: "next" });
  });

  it("redirects unauthenticated users to /sign-in", async () => {
    const proxyFn = await loadProxy();
    const res = proxyFn(createRequest("http://localhost:3000/dashboard"));
    expect(res.type).toBe("redirect");
    expect(res.url).toContain("/sign-in");
  });

  it("allows authenticated users to access protected routes", async () => {
    const proxyFn = await loadProxy();
    const res = proxyFn(
      createRequest("http://localhost:3000/dashboard", "valid-session-token"),
    );
    expect(res).toEqual({ type: "next" });
  });
});
