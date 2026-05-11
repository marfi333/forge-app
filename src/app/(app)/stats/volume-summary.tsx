"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

interface SessionVolume {
  date: string;
  volume: number;
  setCount: number;
}

interface WeekVolume {
  weekStart: string;
  volume: number;
  setCount: number;
  sessionCount: number;
}

export function VolumeSummary() {
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const format = useFormatter();
  const [period, setPeriod] = useState<"session" | "week">("session");

  const { data, isLoading } = useQuery<SessionVolume[] | WeekVolume[]>({
    queryKey: ["stats", "volume", period],
    queryFn: async () => {
      const res = await fetch(`/api/stats/volume?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch volume");
      return res.json();
    },
  });

  const items = data ?? [];

  const chartData = items.map((item) => ({
    label:
      period === "session"
        ? (item as SessionVolume).date.slice(5)
        : `W ${(item as WeekVolume).weekStart.slice(5)}`,
    volume: item.volume,
    sets: item.setCount,
  }));

  const totalVolume = chartData.reduce((sum, d) => sum + d.volume, 0);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "session"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setPeriod("session")}
        >
          {t("perSession")}
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            period === "week"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setPeriod("week")}
        >
          {t("perWeek")}
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-white/5" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">{t("noVolumeData")}</p>
          <p className="text-sm text-muted-foreground">
            {t("completeForVolume")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("totalVolume")}
              </p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {format.number(totalVolume, {
                  notation: "compact",
                  maximumFractionDigits: 1,
                })}{" "}
                <span className="text-base font-normal text-muted-foreground">
                  {tc("kg")}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-chart-1/10 px-2 py-0.5 text-xs font-medium text-chart-1">
              <TrendingUp className="size-3" />
              <span>+8%</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} barCategoryGap="20%">
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Bar
                dataKey="volume"
                fill="var(--chart-1)"
                radius={[4, 4, 4, 4]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
