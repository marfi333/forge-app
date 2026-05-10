"use client";

import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent } from "@/components/ui/card";

interface HistoryEntry {
  date: string;
  bestWeight: number | null;
  totalVolume: number;
  sets: { setNumber: number; reps: number | null; weight: number | null }[];
}

export function ExerciseChart({ exerciseNames }: { exerciseNames: string[] }) {
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
        <p className="text-muted-foreground">No exercise data yet</p>
        <p className="text-sm text-muted-foreground">
          Complete some workouts to see your progression.
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
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm backdrop-blur-sm"
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
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      ) : chartData.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-sm text-muted-foreground">
              No completed sets for this exercise yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Best Weight (kg)
            </p>
            <div>
              <ResponsiveContainer width="100%" height={192}>
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--muted))"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
