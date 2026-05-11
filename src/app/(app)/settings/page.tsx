import Image from "next/image";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { HapticsToggle } from "@/components/haptics-toggle";
import { NavbarStyleToggle } from "@/components/navbar-style-toggle";
import { ReplayTourButton } from "@/components/onboarding/replay-tour-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LanguageSwitcher } from "./language-switcher";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = session.user;
  const t = await getTranslations("settings");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>

      <div className="rounded-2xl border border-border bg-card p-6 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="size-14 rounded-full ring-2 ring-primary/50"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
              {user.name?.charAt(0) ?? "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <LanguageSwitcher />
      <ThemeSwitcher />

      <div className="rounded-2xl border border-border bg-card backdrop-blur-xl divide-y divide-border">
        <HapticsToggle />
        <NavbarStyleToggle />
      </div>

      <div className="rounded-2xl border border-border bg-card backdrop-blur-xl">
        <ReplayTourButton />
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/sign-in" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-400/10 active:bg-red-400/20"
        >
          {t("signOut")}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t("version", { version: process.env.NEXT_PUBLIC_APP_VERSION ?? "" })}
      </p>
    </>
  );
}
