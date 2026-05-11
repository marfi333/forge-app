"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("description")}</p>
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </main>
  );
}
