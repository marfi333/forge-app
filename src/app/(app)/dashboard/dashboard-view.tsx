"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardData {
  today: string;
  weekStart: string;
  weekEnd: string;
  sessionsToday: number;
  workoutsThisWeek: number;
  totalVolume: number;
  workoutDates: string[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(weekStart: string): string[] {
  const start = new Date(`${weekStart}T12:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}

export function DashboardView() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  const weekDates = getWeekDates(data.weekStart);
  const workoutSet = new Set(data.workoutDates);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <p className="text-3xl font-extrabold text-primary">
              {data.sessionsToday}
            </p>
            <p className="text-[11px] text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <p className="text-3xl font-extrabold text-primary">
              {data.workoutsThisWeek}
            </p>
            <p className="text-[11px] text-muted-foreground">This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <p className="text-3xl font-extrabold text-primary">
              {data.totalVolume > 0
                ? data.totalVolume >= 1000
                  ? `${(data.totalVolume / 1000).toFixed(1)}k`
                  : data.totalVolume
                : "0"}
            </p>
            <p className="text-[11px] text-muted-foreground">Volume (kg)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold">This Week</p>
            <Link
              href="/calendar"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Full Calendar →
            </Link>
          </div>
          <div className="flex justify-between">
            {DAY_LABELS.map((label, i) => {
              const date = weekDates[i];
              const hasWorkout = workoutSet.has(date);
              const isToday = date === data.today;
              return (
                <div key={label} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">
                    {label}
                  </span>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                      hasWorkout
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "ring-1 ring-primary text-foreground"
                          : "bg-white/5 text-muted-foreground"
                    }`}
                  >
                    {new Date(`${date}T12:00:00`).getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Link
        href="/sessions/new"
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground text-base transition-opacity hover:opacity-90 active:opacity-80"
      >
        Start Workout
      </Link>
    </div>
  );
}
