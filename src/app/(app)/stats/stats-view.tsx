"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExerciseChart } from "./exercise-chart";
import { PersonalRecords } from "./personal-records";
import { VolumeSummary } from "./volume-summary";

const TABS = ["Chart", "Records", "Volume"] as const;
type Tab = (typeof TABS)[number];

export function StatsView() {
  const [activeTab, setActiveTab] = useState<Tab>("Chart");

  const { data: exerciseNames = [] } = useQuery<string[]>({
    queryKey: ["stats", "exercises"],
    queryFn: async () => {
      const res = await fetch("/api/stats/exercises");
      if (!res.ok) throw new Error("Failed to fetch exercises");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progression</h1>

      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Chart" && <ExerciseChart exerciseNames={exerciseNames} />}
      {activeTab === "Records" && <PersonalRecords />}
      {activeTab === "Volume" && <VolumeSummary />}
    </div>
  );
}
