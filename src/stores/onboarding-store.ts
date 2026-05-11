import { create } from "zustand";
import { type TourStep, tourSteps } from "@/lib/onboarding-steps";

interface OnboardingState {
  isActive: boolean;
  hasCompleted: boolean;
  currentStep: number;
  steps: TourStep[];
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  resetTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  isActive: false,
  hasCompleted: false,
  currentStep: 0,
  steps: tourSteps,
  startTour: () => set({ isActive: true, currentStep: 0 }),
  nextStep: () =>
    set((state) => {
      const next = state.currentStep + 1;
      if (next >= state.steps.length) {
        return { isActive: false, hasCompleted: true, currentStep: 0 };
      }
      return { currentStep: next };
    }),
  skipTour: () => set({ isActive: false, hasCompleted: true, currentStep: 0 }),
  resetTour: () =>
    set({ isActive: false, hasCompleted: false, currentStep: 0 }),
}));
