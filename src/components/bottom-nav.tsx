"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { useHaptics } from "@/components/haptics-provider";
import { useNavbarStyle } from "@/components/navbar-style-provider";

const navItems = [
  { href: "/dashboard", labelKey: "home" as const, icon: HomeIcon },
  { href: "/templates", labelKey: "plan" as const, icon: ClipboardIcon },
  { href: "/stats", labelKey: "stats" as const, icon: ChartIcon },
  { href: "/settings", labelKey: "settings" as const, icon: SettingsIcon },
];

const hiddenRoutes = ["/", "/sign-in", "/offline"];

export function BottomNav() {
  const pathname = usePathname();
  const { trigger } = useHaptics();
  const { style } = useNavbarStyle();
  const t = useTranslations("nav");

  if (hiddenRoutes.includes(pathname)) return null;

  if (style === "glass")
    return <GlassNav pathname={pathname} trigger={trigger} t={t} />;
  return <RegularNav pathname={pathname} trigger={trigger} t={t} />;
}

function RegularNav({
  pathname,
  trigger,
  t,
}: {
  pathname: string;
  trigger: ReturnType<typeof useHaptics>["trigger"];
  t: (key: "home" | "plan" | "stats" | "settings") => string;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl pb-[calc(env(safe-area-inset-bottom,0)-10px)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-6">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => trigger("light")}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function GlassNav({
  pathname,
  trigger,
  t,
}: {
  pathname: string;
  trigger: ReturnType<typeof useHaptics>["trigger"];
  t: (key: "home" | "plan" | "stats" | "settings") => string;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const lastHapticIndex = useRef<number | null>(null);

  const activeIndex = navItems.findIndex(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  const getIndexFromTouch = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left - 8;
    const index = Math.floor(x / 72);
    if (index < 0 || index >= navItems.length) return null;
    return index;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const index = getIndexFromTouch(e.touches[0].clientX);
      if (index !== null) {
        setDragIndex(index);
        lastHapticIndex.current = index;
        trigger("light");
      }
    },
    [getIndexFromTouch, trigger],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const index = getIndexFromTouch(e.touches[0].clientX);
      if (index !== null && index !== dragIndex) {
        setDragIndex(index);
        if (index !== lastHapticIndex.current) {
          lastHapticIndex.current = index;
          trigger("light");
        }
      }
    },
    [getIndexFromTouch, dragIndex, trigger],
  );

  const handleTouchEnd = useCallback(() => {
    if (dragIndex !== null) {
      const target = navItems[dragIndex];
      if (target && target.href !== pathname) {
        router.push(target.href);
      }
      setDragIndex(null);
      lastHapticIndex.current = null;
    }
  }, [dragIndex, pathname, router]);

  const displayIndex = dragIndex ?? activeIndex;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-6 pb-[calc(env(safe-area-inset-bottom,0)-6px)]">
      <div
        ref={containerRef}
        className="relative flex items-center rounded-full border border-border bg-card/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] px-2 py-2"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-9 w-[60px] rounded-full bg-primary/25 blur-lg pointer-events-none ${dragIndex !== null ? "transition-all duration-150 ease-out" : "transition-all duration-300 ease-in-out"}`}
          style={{
            left: `calc(${displayIndex >= 0 ? displayIndex : 0} * 72px + 8px)`,
            opacity: displayIndex >= 0 ? 1 : 0,
          }}
        />
        {navItems.map((item, index) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isDragTarget = dragIndex === index;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => trigger("light")}
              className={`relative z-10 flex w-[68px] flex-col items-center gap-0.5 py-1.5 rounded-full transition-all duration-200 active:scale-90 ${isDragTarget ? "text-primary scale-110" : isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 11 4-4 4 4 5-5" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
