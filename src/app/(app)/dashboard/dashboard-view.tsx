"use client";

import { useQuery } from "@tanstack/react-query";
import { Dumbbell, Footprints, Moon, Waves } from "lucide-react";
import Link from "next/link";
import { TourTrigger } from "@/components/onboarding/tour-trigger";

interface WeeklyPlanDay {
  weekday: string;
  date: string;
  dayType: "workout" | "rest";
  template: { id: string; name: string; muscleGroup: string | null } | null;
  hasSession: boolean;
  isCompleted: boolean;
}

interface DashboardData {
  today: string;
  weekStart: string;
  weekEnd: string;
  weeklyPlan: WeeklyPlanDay[];
  completedCount: number;
  workoutDays: number;
  restDays: number;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMuscleGroupIcon(muscleGroup: string | null) {
  switch (muscleGroup?.toLowerCase()) {
    case "legs":
    case "quads":
    case "hamstrings":
    case "glutes":
    case "calves":
      return <Footprints className="size-5" />;
    case "back":
    case "upper back":
    case "lower back":
      return <Waves className="size-5" />;
    default:
      return <Dumbbell className="size-5" />;
  }
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
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const progressPercent =
    data.workoutDays > 0
      ? Math.min(
          100,
          Math.round((data.completedCount / data.workoutDays) * 100),
        )
      : 0;

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset =
    circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-6">
      <TourTrigger />
      <h2 className="text-xl font-bold">Weekly Plan</h2>

      {/* Summary Card */}
      <section className="relative overflow-hidden rounded-xl border border-white/10 bg-card/80 backdrop-blur-xl p-5">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="flex justify-between items-center relative z-10">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
              Completion
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary">
                {data.completedCount}
              </span>
              <span className="text-base text-muted-foreground">
                / {data.workoutDays || 7} Workouts
              </span>
            </div>
            {data.restDays > 0 && (
              <span className="text-sm text-muted-foreground mt-1.5">
                {data.restDays} Rest Days Planned
              </span>
            )}
          </div>

          {/* Progress Ring */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg
              className="w-full h-full -rotate-90"
              viewBox="0 0 100 100"
              role="img"
              aria-label="Weekly completion progress"
            >
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-semibold text-foreground">
              {progressPercent}%
            </span>
          </div>
        </div>
      </section>

      {/* Days Grid (Bento Style) */}
      <section data-tour="weekly-plan" className="grid grid-cols-2 gap-3">
        {data.weeklyPlan.map((day, i) => (
          <DayCard
            key={day.date}
            day={day}
            label={DAY_LABELS[i]}
            isLast={i === 6}
          />
        ))}
      </section>

      {/* Calendar Link */}
      <Link
        href="/calendar"
        className="flex h-12 w-full items-center justify-center rounded-xl border border-white/10 bg-card/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        View Full Calendar
      </Link>

      {/* Start Workout CTA */}
      <Link
        href="/sessions/new"
        data-tour="start-workout"
        className="flex h-14 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground text-base transition-opacity hover:opacity-90 active:opacity-80"
      >
        Start Workout
      </Link>
    </div>
  );
}

function DayCard({
  day,
  label,
  isLast,
}: {
  day: WeeklyPlanDay;
  label: string;
  isLast: boolean;
}) {
  const isWorkout = day.dayType === "workout";
  const cardClasses = isLast ? "col-span-2" : "";

  const content = (
    <div
      className={`
        relative overflow-hidden rounded-xl p-4 flex flex-col justify-between items-start text-left transition-all
        ${isLast ? "flex-row items-center" : "h-28"}
        ${
          isWorkout
            ? "bg-card/90 backdrop-blur-md border border-primary/40 shadow-[inset_0_0_20px_hsl(var(--primary)/0.05)]"
            : "bg-card/40 backdrop-blur-md border border-white/5 opacity-80"
        }
        ${cardClasses}
      `}
    >
      {isWorkout && (
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
      )}

      {isLast ? (
        <div className="flex w-full justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              {label}
            </span>
            <span
              className={`text-lg font-bold mt-1 ${isWorkout ? "text-primary" : "text-muted-foreground"}`}
            >
              {isWorkout ? day.template?.name || "Workout" : "Rest"}
            </span>
          </div>
          <span
            className={`${isWorkout ? "text-primary" : "text-muted-foreground"} opacity-60`}
          >
            {isWorkout ? (
              getMuscleGroupIcon(day.template?.muscleGroup ?? null)
            ) : (
              <Moon className="size-6" />
            )}
          </span>
        </div>
      ) : (
        <>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
          <div className="flex w-full justify-between items-end mt-auto">
            <span
              className={`text-lg font-bold ${isWorkout ? "text-primary" : "text-muted-foreground"}`}
            >
              {isWorkout ? day.template?.name || "Workout" : "Rest"}
            </span>
            <span
              className={`${isWorkout ? "text-primary" : "text-muted-foreground"}`}
            >
              {isWorkout ? (
                getMuscleGroupIcon(day.template?.muscleGroup ?? null)
              ) : (
                <Moon className="size-5" />
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );

  if (isWorkout && day.template) {
    return (
      <Link
        href={`/sessions/new?templateId=${day.template.id}`}
        className={cardClasses}
      >
        {content}
      </Link>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}
