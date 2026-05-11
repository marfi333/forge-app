"use client";

import { useTranslations } from "next-intl";

interface MotivationData {
  daysSinceLastWorkout: number | null;
  streak: number;
  todayIsWorkout: boolean;
  recentPR: { exercise: string; weight: number } | null;
}

type MessageKind =
  | "pr"
  | "todayWorkout"
  | "todayRest"
  | "streak"
  | "nudge"
  | "greetingMorning"
  | "greetingAfternoon"
  | "greetingEvening";

interface SelectedMessage {
  kind: MessageKind;
  emoji: string;
  values?: Record<string, string | number>;
}

function getTimeOfDayKind(
  hour: number,
): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour >= 5 && hour < 12) return "greetingMorning";
  if (hour >= 12 && hour < 17) return "greetingAfternoon";
  return "greetingEvening";
}

export function selectMessage(
  motivation: MotivationData,
  hour: number,
): SelectedMessage {
  if (motivation.recentPR) {
    return {
      kind: "pr",
      emoji: "🏆",
      values: {
        exercise: motivation.recentPR.exercise,
      },
    };
  }

  if (motivation.todayIsWorkout) {
    return { kind: "todayWorkout", emoji: "🔥" };
  }

  if (motivation.streak >= 2) {
    return {
      kind: "streak",
      emoji: "💪",
      values: { count: motivation.streak },
    };
  }

  if (
    motivation.daysSinceLastWorkout !== null &&
    motivation.daysSinceLastWorkout >= 2
  ) {
    return {
      kind: "nudge",
      emoji: "👋",
      values: { count: motivation.daysSinceLastWorkout },
    };
  }

  if (!motivation.todayIsWorkout && motivation.daysSinceLastWorkout !== null) {
    return { kind: "todayRest", emoji: "😌" };
  }

  const timeKind = getTimeOfDayKind(hour);
  const emoji =
    timeKind === "greetingMorning"
      ? "☀️"
      : timeKind === "greetingAfternoon"
        ? "🌤️"
        : "🌙";
  return { kind: timeKind, emoji };
}

export function MotivationalBanner({
  motivation,
}: {
  motivation: MotivationData;
}) {
  const t = useTranslations("dashboard.motivation");
  const hour = new Date().getHours();
  const message = selectMessage(motivation, hour);

  return (
    <section
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/60 backdrop-blur-md px-4 py-3"
    >
      <span className="text-2xl motivation-emoji-bounce" aria-hidden="true">
        {message.emoji}
      </span>
      <p className="text-sm font-medium text-foreground/90">
        {t(message.kind, message.values)}
      </p>
    </section>
  );
}

export function MotivationalBannerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-14 w-full animate-pulse rounded-xl bg-muted"
    />
  );
}
