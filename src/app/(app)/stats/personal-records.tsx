"use client";

import { useQuery } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  reps: number | null;
  date: string;
}

export function PersonalRecords() {
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
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <Trophy className="size-8 text-muted-foreground" />
        <p className="text-muted-foreground">No personal records yet</p>
        <p className="text-sm text-muted-foreground">
          Complete workouts with weights to see your PRs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Card key={record.exerciseName}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <Trophy className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{record.exerciseName}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(`${record.date}T12:00:00`).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">
                {record.maxWeight} kg
              </p>
              {record.reps !== null && (
                <p className="text-xs text-muted-foreground">
                  {record.reps} reps
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
