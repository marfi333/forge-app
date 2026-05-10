import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const publicPaths = ["/sign-in", "/api/auth", "/offline"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");

  if (!sessionToken) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
