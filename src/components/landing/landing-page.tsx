"use client";

import { Activity, BarChart3, Timer } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import appLogo from "@/../public/app_logo.png";

interface LandingStats {
  totalWorkouts: number;
  totalUsers: number;
  totalExercises: number;
}

export function LandingPage() {
  const t = useTranslations("landing");
  const [stats, setStats] = useState<LandingStats | null>(null);

  useEffect(() => {
    fetch("/api/landing-stats")
      .then((res) => res.json())
      .then((data) => setStats(data as LandingStats))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-svh bg-[#121414]">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#121414]/80 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-5">
          <div className="flex items-center gap-1">
            <Image src={appLogo} alt="FORGE" width={32} height={32} />
            <span className="text-xl font-black tracking-tight text-white">
              FORGE
            </span>
          </div>
          <Link
            href="/sign-in"
            className="rounded-lg bg-[#ccff00] px-4 py-2 text-sm font-semibold text-[#121414] transition-opacity hover:opacity-90 active:opacity-80"
          >
            {t("signIn")}
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center px-5 pt-32 pb-16 text-center overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('/landing-hero.jpg')" }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-[#121414] via-transparent to-[#121414]" />
          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
              {t("hero.title")}
            </h1>
            <p className="mt-4 max-w-sm mx-auto text-base text-white/70 leading-relaxed">
              {t("hero.tagline")}
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#ccff00] px-8 text-base font-bold text-[#121414] transition-opacity hover:opacity-90 active:opacity-80"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-5 py-12">
          <div className="mx-auto max-w-md space-y-4">
            <FeatureCard
              icon={<Activity className="size-6 text-[#ccff00]" />}
              title={t("features.metrics.title")}
              description={t("features.metrics.description")}
            />
            <FeatureCard
              icon={<Timer className="size-6 text-[#ccff00]" />}
              title={t("features.rest.title")}
              description={t("features.rest.description")}
            />
            <FeatureCard
              icon={<BarChart3 className="size-6 text-[#ccff00]" />}
              title={t("features.analytics.title")}
              description={t("features.analytics.description")}
            />
          </div>
        </section>

        {/* Stats Section */}
        {stats && (
          <section className="px-5 py-12">
            <div className="mx-auto grid max-w-md grid-cols-3 gap-3">
              <StatCard value={stats.totalWorkouts} label={t("stats.workouts")} />
              <StatCard value={stats.totalUsers} label={t("stats.users")} />
              <StatCard value={stats.totalExercises} label={t("stats.exercises")} />
            </div>
          </section>
        )}

        {/* Footer CTA */}
        <section className="px-5 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t("footer.title")}
          </h2>
          <p className="mt-2 text-sm text-white/60">{t("footer.tagline")}</p>
          <Link
            href="/sign-in"
            className="mt-6 inline-flex h-12 items-center rounded-xl border border-[#ccff00]/30 bg-[#ccff00]/10 px-8 text-base font-semibold text-[#ccff00] transition-colors hover:bg-[#ccff00]/20 active:bg-[#ccff00]/30"
          >
            {t("footer.cta")}
          </Link>
        </section>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-5 backdrop-blur-xl">
      <div className="mb-3">{icon}</div>
      <h3 className="text-base font-bold text-white">{title}</h3>
      <p className="mt-1 text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1a1a]/80 p-4 text-center backdrop-blur-xl">
      <p className="text-2xl font-extrabold text-[#ccff00]">
        {value.toLocaleString()}
      </p>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  );
}
