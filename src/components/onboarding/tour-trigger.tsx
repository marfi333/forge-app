"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useOnboardingStore } from "@/stores/onboarding-store";

interface OnboardingStatus {
  completed: boolean;
  completedAt: string | null;
}

export function TourTrigger() {
  const { startTour, isActive, hasCompleted } = useOnboardingStore();
  const hasTriggered = useRef(false);

  const { data } = useQuery<OnboardingStatus>({
    queryKey: ["onboarding"],
    queryFn: async () => {
      const res = await fetch("/api/onboarding");
      if (!res.ok) throw new Error("Failed to fetch onboarding status");
      return res.json();
    },
  });

  useEffect(() => {
    if (
      data &&
      !data.completed &&
      !isActive &&
      !hasCompleted &&
      !hasTriggered.current
    ) {
      hasTriggered.current = true;
      startTour();
    }
  }, [data, isActive, hasCompleted, startTour]);

  return null;
}
