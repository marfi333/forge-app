"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  reps: number | null;
  date: string;
}

export function PersonalRecords() {
  const t = useTranslations("stats");
  const tc = useTranslations("common");
  const format = useFormatter();
  const { data: records = [], isLoading } = useQuery<PersonalRecord[]>({
    queryKey: ["stats", "personal-records"],
    queryFn: async () => {
      const res = await fetch("/api/stats/personal-records");
      if (!res.ok) throw new Error("Failed to fetch records");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Trophy className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">{t("noRecordsYet")}</p>
        <p className="text-sm text-muted-foreground">
          {t("completeForRecords")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.exerciseName}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--chart-1)/20">
            <Trophy className="size-5 text-chart-1" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{record.exerciseName}</p>
            <p className="text-sm text-muted-foreground">
              {format.dateTime(new Date(`${record.date}T12:00:00`), {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-chart-1">
              {record.maxWeight} {tc("kg")}
            </p>
            {record.reps !== null && (
              <p className="text-xs text-muted-foreground">
                {record.reps} {tc("reps")}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
