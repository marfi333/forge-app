"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

interface ActivityDay {
  date: string;
  sets: number;
  volume: number;
}

interface ActivityResponse {
  days: ActivityDay[];
  weeks: number;
}

function getIntensity(sets: number): number {
  if (sets === 0) return 0;
  if (sets <= 5) return 1;
  if (sets <= 15) return 2;
  if (sets <= 25) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  "bg-white/5",
  "bg-chart-1/20",
  "bg-chart-1/40",
  "bg-chart-1/60",
  "bg-chart-1/80",
];

const DAY_LABEL_KEYS = ["mon", null, "wed", null, "fri", null, null] as const;

export function ActivityGrid() {
  const t = useTranslations("stats");
  const { data, isLoading } = useQuery<ActivityResponse>({
    queryKey: ["stats", "activity"],
    queryFn: async () => {
      const res = await fetch("/api/stats/activity?weeks=12");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
  });

  if (isLoading) {
    return <div className="h-28 animate-pulse rounded-xl bg-white/5" />;
  }

  const weeks = data?.weeks ?? 12;
  const dayMap = new Map((data?.days ?? []).map((d) => [d.date, d]));

  const now = new Date();
  const grid: { date: string; intensity: number }[][] = [];

  for (let w = weeks - 1; w >= 0; w--) {
    const week: { date: string; intensity: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(now);
      const currentDay = cellDate.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      cellDate.setDate(cellDate.getDate() + mondayOffset - w * 7 + d);

      if (cellDate > now) {
        week.push({ date: "", intensity: -1 });
        continue;
      }

      const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, "0")}-${String(cellDate.getDate()).padStart(2, "0")}`;
      const activity = dayMap.get(dateStr);
      week.push({
        date: dateStr,
        intensity: getIntensity(activity?.sets ?? 0),
      });
    }
    grid.push(week);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <p className="mb-3 text-sm font-medium text-muted-foreground">
        {t("trainingActivity")}
      </p>
      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] pr-1 pt-0">
          {DAY_LABEL_KEYS.map((key, i) => (
            <div
              key={`label-${i}`}
              className="flex h-[14px] items-center text-[9px] leading-none text-muted-foreground"
            >
              {key ? t(`activityDayLabels.${key}`) : ""}
            </div>
          ))}
        </div>
        <div
          className="grid flex-1 gap-[3px]"
          style={{ gridTemplateColumns: `repeat(${grid.length}, 1fr)` }}
        >
          {grid.map((week, wi) => (
            <div key={`week-${wi}`} className="flex flex-col gap-[3px]">
              {week.map((cell, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`aspect-square w-full rounded-sm ${cell.intensity < 0 ? "opacity-0" : INTENSITY_CLASSES[cell.intensity]}`}
                  title={
                    cell.date
                      ? `${cell.date}: ${dayMap.get(cell.date)?.sets ?? 0} sets`
                      : undefined
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
        <span>{t("less")}</span>
        {INTENSITY_CLASSES.map((cls, i) => (
          <div key={`legend-${i}`} className={`size-3 rounded-sm ${cls}`} />
        ))}
        <span>{t("more")}</span>
      </div>
    </div>
  );
}
