"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const hiddenRoutes = ["/", "/sign-in", "/offline"];

export function TopHeader() {
  const pathname = usePathname();
  const t = useTranslations("notifications");

  const { data: user } = useQuery<SessionUser | null>({
    queryKey: ["session-user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/session");
      if (!res.ok) return null;
      const data: { user?: SessionUser } = await res.json();
      return data?.user ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (hiddenRoutes.includes(pathname)) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
        {user?.image ? (
          <Image
            src={user.image}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="size-8 rounded-full ring-2 ring-primary/50"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
        )}
        <span className="text-3xl font-black tracking-tight">FORGE</span>
        <Drawer>
          <DrawerTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="size-5" />
            </button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t("title")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
              <Bell className="size-6 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </header>
  );
}
