"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLORS = {
  light: "#ffffff",
  dark: "#121414",
} as const;

export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color =
      THEME_COLORS[resolvedTheme as keyof typeof THEME_COLORS] ??
      THEME_COLORS.dark;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", color);
    }
  }, [resolvedTheme]);

  return null;
}
