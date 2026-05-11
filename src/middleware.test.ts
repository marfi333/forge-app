import { describe, expect, it, vi } from "vitest";

function createMockCookies() {
  const store = new Map<string, { value: string }>();
  return {
    get: (name: string) => store.get(name),
    set: (name: string, value: string) => store.set(name, { value }),
    _store: store,
  };
}

vi.mock("next/server", () => ({
  NextResponse: {
    next: () => {
      const cookies = createMockCookies();
      return { type: "next", cookies };
    },
    redirect: (url: URL) => {
      const cookies = createMockCookies();
      return { type: "redirect", url: url.toString(), cookies };
    },
  },
}));

function createRequest(
  url: string,
  opts?: {
    sessionToken?: string;
    cookies?: Record<string, string>;
    acceptLanguage?: string;
  },
): {
  nextUrl: URL;
  cookies: { get: (name: string) => { value: string } | undefined };
  headers: { get: (name: string) => string | null };
} {
  const allCookies: Record<string, string> = { ...opts?.cookies };
  if (opts?.sessionToken)
    allCookies["authjs.session-token"] = opts.sessionToken;

  return {
    nextUrl: new URL(url),
    cookies: {
      get: (name: string) =>
        allCookies[name] ? { value: allCookies[name] } : undefined,
    },
    headers: {
      get: (name: string) => {
        if (name === "accept-language") return opts?.acceptLanguage ?? null;
        return null;
      },
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
      cookies: ReturnType<typeof createMockCookies>;
    };
  }

  it("allows access to /sign-in without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(createRequest("http://localhost:3000/sign-in"));
    expect(res.type).toBe("next");
  });

  it("allows access to /api/auth routes without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(
      createRequest("http://localhost:3000/api/auth/callback/google"),
    );
    expect(res.type).toBe("next");
  });

  it("allows access to /offline without auth", async () => {
    const mw = await loadMiddleware();
    const res = mw(createRequest("http://localhost:3000/offline"));
    expect(res.type).toBe("next");
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
      createRequest("http://localhost:3000/dashboard", {
        sessionToken: "valid-session-token",
      }),
    );
    expect(res.type).toBe("next");
  });

  it("sets NEXT_LOCALE cookie from Accept-Language when no cookie exists", async () => {
    const mw = await loadMiddleware();
    const res = mw(
      createRequest("http://localhost:3000/sign-in", {
        acceptLanguage: "hu,en;q=0.9",
      }),
    );
    expect(res.type).toBe("next");
    expect(res.cookies._store.get("NEXT_LOCALE")?.value).toBe("hu");
  });

  it("does not overwrite existing NEXT_LOCALE cookie", async () => {
    const mw = await loadMiddleware();
    const res = mw(
      createRequest("http://localhost:3000/sign-in", {
        cookies: { NEXT_LOCALE: "en" },
        acceptLanguage: "hu",
      }),
    );
    expect(res.type).toBe("next");
    expect(res.cookies._store.has("NEXT_LOCALE")).toBe(false);
  });
});
