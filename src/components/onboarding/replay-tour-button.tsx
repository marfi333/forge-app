"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/stores/onboarding-store";

export function ReplayTourButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { startTour } = useOnboardingStore();

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      if (!res.ok) throw new Error("Failed to reset onboarding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      router.push("/dashboard");
      setTimeout(() => startTour(), 500);
    },
  });

  return (
    <button
      type="button"
      onClick={() => resetMutation.mutate()}
      disabled={resetMutation.isPending}
      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50"
    >
      {resetMutation.isPending ? "Resetting..." : "Replay Onboarding Tour"}
    </button>
  );
}
