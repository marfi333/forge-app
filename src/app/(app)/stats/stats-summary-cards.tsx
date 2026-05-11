"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface PeriodStats {
  totalVolume: number;
  totalSets: number;
  workoutCount: number;
  prCount: number;
}

interface SummaryResponse {
  current: PeriodStats;
  previous: PeriodStats;
}

function TrendBadge({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0) return null;
  const diff = current - previous;
  const pct = Math.round((diff / previous) * 100);
  if (pct === 0) return null;

  const isUp = pct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-[var(--chart-1)]" : "text-red-400"}`}
    >
      {isUp ? (
        <TrendingUp className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {isUp ? "+" : ""}
      {pct}%
    </span>
  );
}

function StatCard({
  label,
  value,
  current,
  previous,
}: {
  label: string;
  value: string;
  current: number;
  previous: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/50 p-4 backdrop-blur-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-3xl font-extrabold tracking-tight">{value}</p>
        <TrendBadge current={current} previous={previous} />
      </div>
    </div>
  );
}

export function StatsSummaryCards({ period }: { period: "week" | "month" }) {
  const t = useTranslations("stats");
  const format = useFormatter();
  const { data, isLoading } = useQuery<SummaryResponse>({
    queryKey: ["stats", "summary", period],
    queryFn: async () => {
      const res = await fetch(`/api/stats/summary?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-20 animate-pulse rounded-xl bg-muted/50"
          />
        ))}
      </div>
    );
  }

  const current = data?.current ?? {
    totalVolume: 0,
    totalSets: 0,
    workoutCount: 0,
    prCount: 0,
  };
  const previous = data?.previous ?? {
    totalVolume: 0,
    totalSets: 0,
    workoutCount: 0,
    prCount: 0,
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label={t("totalVolume")}
        value={format.number(current.totalVolume)}
        current={current.totalVolume}
        previous={previous.totalVolume}
      />
      <StatCard
        label={t("totalSets")}
        value={current.totalSets.toString()}
        current={current.totalSets}
        previous={previous.totalSets}
      />
      <StatCard
        label={t("workouts")}
        value={current.workoutCount.toString()}
        current={current.workoutCount}
        previous={previous.workoutCount}
      />
      <StatCard
        label={t("exercisesWithPR")}
        value={current.prCount.toString()}
        current={current.prCount}
        previous={previous.prCount}
      />
    </div>
  );
}
