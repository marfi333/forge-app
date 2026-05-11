"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";

interface SessionUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const hiddenRoutes = ["/sign-in", "/offline"];

export function TopHeader() {
  const pathname = usePathname();

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
        {user?.image ? (
          <img
            src={user.image}
            alt=""
            className="size-8 rounded-full ring-2 ring-primary/50"
          />
        ) : (
          <div className="size-8 rounded-full bg-muted" />
        )}
        <span className="text-base font-bold tracking-tight">FORGE</span>
        <button
          type="button"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
