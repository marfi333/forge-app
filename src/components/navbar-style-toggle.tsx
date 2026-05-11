"use client";

import { useTranslations } from "next-intl";
import { useNavbarStyle } from "@/components/navbar-style-provider";

export function NavbarStyleToggle() {
  const t = useTranslations("settings");
  const { style, setStyle } = useNavbarStyle();
  const enabled = style === "glass";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => setStyle(enabled ? "regular" : "glass")}
      className="flex w-full items-center justify-between px-4 py-3 text-sm"
    >
      <span className="font-medium">{t("liquidGlassNavbar")}</span>
      <span
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-background shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}
