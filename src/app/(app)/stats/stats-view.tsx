"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ActivityGrid } from "./activity-grid";
import { PersonalRecords } from "./personal-records";
import { StatsSummaryCards } from "./stats-summary-cards";

const ExerciseChart = dynamic(() => import("./exercise-chart").then(mod => ({ default: mod.ExerciseChart })), { ssr: false });
const VolumeSummary = dynamic(() => import("./volume-summary").then(mod => ({ default: mod.VolumeSummary })), { ssr: false });

const PERIOD_KEYS = ["week", "month"] as const;
type PeriodKey = (typeof PERIOD_KEYS)[number];

export function StatsView() {
  const t = useTranslations("stats");
  const [period, setPeriod] = useState<PeriodKey>("week");

  const { data: exerciseNames = [] } = useQuery<string[]>({
    queryKey: ["stats", "exercises"],
    queryFn: async () => {
      const res = await fetch("/api/stats/exercises");
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
        {PERIOD_KEYS.map((p) => (
          <button
            key={p}
            type="button"
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setPeriod(p)}
          >
            {t(p)}
          </button>
        ))}
      </div>

      <StatsSummaryCards period={period} />

      <section data-tour="stats-charts" className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("exerciseProgression")}
        </h2>
        <ExerciseChart exerciseNames={exerciseNames} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("volumeTrend")}
        </h2>
        <VolumeSummary />
      </section>

      <ActivityGrid />

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("personalRecords")}
        </h2>
        <PersonalRecords />
      </section>
    </div>
  );
}
