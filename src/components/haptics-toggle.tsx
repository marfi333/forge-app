"use client";

import { useHaptics } from "@/components/haptics-provider";

export function HapticsToggle() {
  const { enabled, setEnabled, trigger } = useHaptics();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => {
        const next = !enabled;
        setEnabled(next);
        if (next) trigger("light");
      }}
      className="flex w-full items-center justify-between px-4 py-3 text-sm"
    >
      <span className="font-medium">Haptic Feedback</span>
      <span
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`inline-block size-4 rounded-full bg-background shadow-sm transition-transform ${enabled ? "translate-x-5" : "translate-x-1"}`}
        />
      </span>
    </button>
  );
}
