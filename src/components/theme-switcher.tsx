"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

const THEMES = ["light", "dark", "system"] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("settings");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4 backdrop-blur-xl">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {t("theme")}
      </p>
      <div className="flex gap-2">
        {THEMES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              theme === value
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`theme_${value}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
