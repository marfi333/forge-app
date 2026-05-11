"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface HistoryEntry {
  date: string;
  bestWeight: number | null;
  totalVolume: number;
  sets: { setNumber: number; reps: number | null; weight: number | null }[];
}

export function ExerciseChart({ exerciseNames }: { exerciseNames: string[] }) {
  const t = useTranslations("stats");
  const [selectedExercise, setSelectedExercise] = useState("");

  const exercise = selectedExercise || exerciseNames[0] || "";

  const { data: history = [], isLoading } = useQuery<HistoryEntry[]>({
    queryKey: ["stats", "exercise-history", exercise],
    queryFn: async () => {
      const res = await fetch(
        `/api/stats/exercise-history?name=${encodeURIComponent(exercise)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    enabled: !!exercise,
  });

  if (exerciseNames.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <p className="text-muted-foreground">{t("noExerciseData")}</p>
        <p className="text-sm text-muted-foreground">
          {t("completeForProgression")}
        </p>
      </div>
    );
  }

  const chartData = history.map((h) => ({
    date: h.date.slice(5),
    weight: h.bestWeight,
    volume: h.totalVolume,
  }));

  return (
    <div className="space-y-4">
      <select
        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3 pr-8 py-2 text-sm backdrop-blur-sm bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23a1a1a1%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_0.5rem_center] bg-no-repeat"
        value={exercise}
        onChange={(e) => setSelectedExercise(e.target.value)}
      >
        {exerciseNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-white/5" />
      ) : chartData.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <p className="text-center text-sm text-muted-foreground">
            {t("noSetsYet")}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t("bestWeight")}
          </p>
          <div>
            <ResponsiveContainer width="100%" height={192}>
              <LineChart data={chartData}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--muted)"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  width={40}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    fontSize: "0.75rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--chart-1)" }}
                  activeDot={{ r: 5 }}
                  filter="url(#glow)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
