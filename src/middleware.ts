import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Locale } from "@/i18n/config";
import { defaultLocale, locales } from "@/i18n/config";

const publicPrefixes = ["/sign-in", "/register", "/forgot-password", "/reset-password", "/api/auth", "/api/landing-stats", "/offline"];
const publicExact = ["/"];

function resolveLocale(req: NextRequest): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && locales.includes(cookie as Locale)) return cookie as Locale;

  const acceptLang = req.headers.get("accept-language") ?? "";
  const browserLocale = acceptLang
    .split(",")
    .map((part) => part.split(";")[0].trim().substring(0, 2))
    .find((lang): lang is Locale => locales.includes(lang as Locale));

  return browserLocale ?? defaultLocale;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    publicExact.includes(pathname) ||
    publicPrefixes.some((path) => pathname.startsWith(path));

  const locale = resolveLocale(req);
  const response = isPublic
    ? NextResponse.next()
    : (() => {
        const sessionToken =
          req.cookies.get("authjs.session-token") ??
          req.cookies.get("__Secure-authjs.session-token");

        if (!sessionToken) {
          const signInUrl = new URL("/sign-in", req.nextUrl.origin);
          return NextResponse.redirect(signInUrl);
        }

        return NextResponse.next();
      })();

  if (!req.cookies.get("NEXT_LOCALE")) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/).*)",
  ],
};
