"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { TourOverlay } from "./tour-overlay";

export function TourController() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const navigatingRef = useRef(false);

  const { isActive, currentStep, steps, nextStep, skipTour } =
    useOnboardingStore();

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      if (!res.ok) throw new Error("Failed to complete onboarding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    },
  });

  const step = steps[currentStep];

  useEffect(() => {
    if (!isActive || !step) return;
    if (pathname !== step.page) {
      navigatingRef.current = true;
      router.push(step.page);
    } else {
      navigatingRef.current = false;
    }
  }, [isActive, step, pathname, router]);

  if (!isActive || !step) return null;
  if (pathname !== step.page) return null;

  function handleNext() {
    const isLast = currentStep === steps.length - 1;
    if (isLast) {
      completeMutation.mutate();
      skipTour();
    } else {
      nextStep();
    }
  }

  function handleSkip() {
    completeMutation.mutate();
    skipTour();
  }

  return (
    <TourOverlay
      step={step}
      stepIndex={currentStep}
      totalSteps={steps.length}
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
}
