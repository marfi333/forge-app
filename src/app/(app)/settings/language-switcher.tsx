"use client";

import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";

const LANGUAGES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hu", label: "Magyar" },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("settings");

  const switchLocale = useMutation({
    mutationFn: async (newLocale: Locale) => {
      const res = await fetch("/api/locale", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: newLocale }),
      });
      if (!res.ok) throw new Error("Failed to update locale");
      return res.json();
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4 backdrop-blur-xl">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {t("language")}
      </p>
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            type="button"
            disabled={switchLocale.isPending}
            onClick={() => {
              if (lang.value !== locale) switchLocale.mutate(lang.value);
            }}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
              locale === lang.value
                ? "bg-primary text-primary-foreground"
                : "bg-white/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
