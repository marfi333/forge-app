import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, type Locale, locales } from "./config";

const messageImports = {
  en: () => import("../../messages/en.json"),
  hu: () => import("../../messages/hu.json"),
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value as
    | Locale
    | undefined;

  let locale: Locale;

  if (cookieLocale && locales.includes(cookieLocale)) {
    locale = cookieLocale;
  } else {
    const headerStore = await headers();
    const acceptLanguage = headerStore.get("accept-language") ?? "";
    const browserLocale = acceptLanguage
      .split(",")
      .map((part) => part.split(";")[0].trim().substring(0, 2))
      .find((lang): lang is Locale => locales.includes(lang as Locale));
    locale = browserLocale ?? defaultLocale;
  }

  return {
    locale,
    messages: (await messageImports[locale]()).default,
  };
});
