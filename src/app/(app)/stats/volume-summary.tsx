"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";

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
          Per Session
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
          Per Week
        </button>
      </div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No volume data yet</p>
          <p className="text-sm text-muted-foreground">
            Complete workouts to see your volume trends.
          </p>
        </div>
      ) : (
        <>
          <Card>
            <CardContent>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                Total Volume (kg × reps)
              </p>
              <div>
                <ResponsiveContainer width="100%" height={192}>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--muted))"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                    />
                    <Bar
                      dataKey="volume"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="text-center">
                <p className="text-2xl font-bold">
                  {chartData
                    .reduce((sum, d) => sum + d.volume, 0)
                    .toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Volume (kg)
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center">
                <p className="text-2xl font-bold">
                  {chartData.reduce((sum, d) => sum + d.sets, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Sets</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
