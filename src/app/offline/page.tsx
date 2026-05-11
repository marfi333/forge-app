import { getTranslations } from "next-intl/server";

export default async function OfflinePage() {
  const t = await getTranslations("offline");

  return (
    <main className="flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>
      </div>
    </main>
  );
}
