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
  /** Micro-label key shown above the message in uppercase tracking-widest. */
  labelKey:
    | "labelPR"
    | "labelToday"
    | "labelStreak"
    | "labelNudge"
    | "labelGreeting";
  /** Whether to highlight with the neon primary glow (PR / streak). */
  accent: boolean;
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
      values: { exercise: motivation.recentPR.exercise },
      labelKey: "labelPR",
      accent: true,
    };
  }

  if (motivation.todayIsWorkout) {
    return {
      kind: "todayWorkout",
      emoji: "🔥",
      labelKey: "labelToday",
      accent: true,
    };
  }

  if (motivation.streak >= 2) {
    return {
      kind: "streak",
      emoji: "💪",
      values: { count: motivation.streak },
      labelKey: "labelStreak",
      accent: true,
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
      labelKey: "labelNudge",
      accent: false,
    };
  }

  if (!motivation.todayIsWorkout && motivation.daysSinceLastWorkout !== null) {
    return {
      kind: "todayRest",
      emoji: "😌",
      labelKey: "labelToday",
      accent: false,
    };
  }

  const timeKind = getTimeOfDayKind(hour);
  const emoji =
    timeKind === "greetingMorning"
      ? "☀️"
      : timeKind === "greetingAfternoon"
        ? "🌤️"
        : "🌙";
  return { kind: timeKind, emoji, labelKey: "labelGreeting", accent: false };
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
      className="relative overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-xl p-3"
    >
      {message.accent && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
      )}
      <div className="flex items-center gap-4 relative z-10">
        <span
          className="text-3xl motivation-emoji-bounce shrink-0"
          aria-hidden="true"
        >
          {message.emoji}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-0">
            {t(message.labelKey)}
          </span>
          <p
            className={`text-base font-bold leading-tight ${
              message.accent ? "text-primary" : "text-foreground"
            }`}
          >
            {t(message.kind, message.values)}
          </p>
        </div>
      </div>
    </section>
  );
}

export function MotivationalBannerSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="h-[88px] w-full animate-pulse rounded-xl bg-muted"
    />
  );
}
