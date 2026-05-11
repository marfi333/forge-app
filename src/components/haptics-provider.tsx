"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useWebHaptics } from "web-haptics/react";

type HapticPreset =
  | "light"
  | "medium"
  | "heavy"
  | "soft"
  | "rigid"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | "nudge"
  | "buzz";

interface HapticsContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  trigger: (preset?: HapticPreset) => void;
}

const HapticsContext = createContext<HapticsContextValue | null>(null);

const STORAGE_KEY = "haptics-enabled";

export function HapticsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const haptic = useWebHaptics();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setEnabledState(stored === "true");
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const trigger = useCallback(
    (preset: HapticPreset = "light") => {
      if (!enabled) return;
      haptic.trigger(preset);
    },
    [enabled, haptic],
  );

  return (
    <HapticsContext value={{ enabled, setEnabled, trigger }}>
      {children}
    </HapticsContext>
  );
}

export function useHaptics() {
  const ctx = use(HapticsContext);
  if (!ctx) throw new Error("useHaptics must be used within HapticsProvider");
  return ctx;
}
