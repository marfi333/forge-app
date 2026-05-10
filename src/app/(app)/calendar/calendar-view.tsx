"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDrag } from "@use-gesture/react";
import { ChevronLeft, ChevronRight, Dumbbell, Moon } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CalendarDay {
  id: string;
  userId: string;
  date: string;
  type: "workout" | "rest";
}

interface Session {
  id: string;
  date: string;
  status: string;
}

function getMonthString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LONG_PRESS_MS = 500;

interface DayCellProps {
  day: number;
  dateStr: string;
  calDay: CalendarDay | undefined;
  hasSession: boolean;
  isToday: boolean;
  isSelected: boolean;
  onSelect: (dateStr: string) => void;
  onLongPress: (dateStr: string) => void;
}

function DayCell({
  day,
  dateStr,
  calDay,
  hasSession,
  isToday,
  isSelected,
  onSelect,
  onLongPress,
}: DayCellProps) {
  const longPressTriggered = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);

  function clearTimer() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPressing(false);
  }

  const bind = useDrag(
    ({ tap, first, last, movement: [mx, my] }) => {
      if (tap) {
        if (!longPressTriggered.current) {
          onSelect(dateStr);
        }
        longPressTriggered.current = false;
        setPressing(false);
        return;
      }
      if (first) {
        longPressTriggered.current = false;
        setPressing(true);
        timerRef.current = setTimeout(() => {
          longPressTriggered.current = true;
          setPressing(false);
          onLongPress(dateStr);
        }, LONG_PRESS_MS);
      }
      if (Math.abs(mx) > 5 || Math.abs(my) > 5) {
        clearTimer();
      }
      if (last) {
        clearTimer();
      }
    },
    { filterTaps: true, pointer: { touch: true } },
  );

  return (
    <div
      {...bind()}
      className={`relative flex aspect-square touch-none flex-col items-center justify-center rounded-lg text-sm transition-all select-none ${
        calDay?.type === "rest"
          ? "bg-muted text-muted-foreground"
          : "hover:bg-muted/50"
      } ${isSelected ? "ring-2 ring-primary" : isToday ? "ring-1 ring-primary/50" : ""} ${pressing ? "scale-90 opacity-75" : ""}`}
    >
      <span className="font-medium">{day}</span>
      {calDay?.type === "rest" && (
        <Moon className="absolute bottom-0.5 size-3" />
      )}
      {hasSession && (
        <span className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-primary" />
      )}
    </div>
  );
}

export function CalendarView() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  });
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = getMonthString(currentDate);

  const { data: days = [], isLoading } = useQuery<CalendarDay[]>({
    queryKey: ["calendar", monthStr],
    queryFn: async () => {
      const res = await fetch(`/api/calendar?month=${monthStr}`);
      if (!res.ok) throw new Error("Failed to fetch calendar");
      return res.json();
    },
  });

  const { data: sessions = [] } = useQuery<Session[]>({
    queryKey: ["sessions", monthStr],
    queryFn: async () => {
      const res = await fetch(`/api/sessions?month=${monthStr}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
  });

  const upsertDay = useMutation({
    mutationFn: async ({
      date,
      type,
    }: {
      date: string;
      type: "workout" | "rest";
    }) => {
      const res = await fetch("/api/calendar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, type }),
      });
      if (!res.ok) throw new Error("Failed to update day");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", monthStr] });
    },
  });

  const deleteDay = useMutation({
    mutationFn: async (date: string) => {
      const res = await fetch(`/api/calendar?date=${date}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete day");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar", monthStr] });
    },
  });

  const dayMap = new Map(days.map((d) => [d.date, d]));
  const sessionMap = new Map<string, Session>();
  for (const s of sessions) {
    sessionMap.set(s.date, s);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);

  const handleDaySelect = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  const handleDayLongPress = useCallback(
    (dateStr: string) => {
      const existing = dayMap.get(dateStr);
      if (!existing) {
        upsertDay.mutate({ date: dateStr, type: "workout" });
      } else if (existing.type === "workout") {
        upsertDay.mutate({ date: dateStr, type: "rest" });
      } else {
        deleteDay.mutate(dateStr);
      }
    },
    [dayMap, upsertDay, deleteDay],
  );

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  const today = new Date();
  const todayStr = formatDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="size-8" />
          <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          <div className="size-8" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={`skel-${i.toString()}`}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
          <ChevronLeft />
        </Button>
        <h1 className="text-lg font-bold tracking-tight">
          {MONTH_NAMES[month]} {year}
        </h1>
        <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {label}
          </div>
        ))}

        {Array.from({ length: firstDay }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static spacers that never reorder
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = formatDate(year, month, day);
          const calDay = dayMap.get(dateStr);
          const hasSession = sessionMap.has(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <DayCell
              key={day}
              day={day}
              dateStr={dateStr}
              calDay={calDay}
              hasSession={hasSession}
              isToday={isToday}
              isSelected={isSelected}
              onSelect={handleDaySelect}
              onLongPress={handleDayLongPress}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Dumbbell className="size-3" /> Workout
        </span>
        <span className="flex items-center gap-1">
          <Moon className="size-3" /> Rest
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-primary" /> Session logged
        </span>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {selectedDate === todayStr
            ? "Today’s Sessions"
            : `Sessions — ${selectedDate}`}
        </h2>
        {sessions.filter((s) => s.date === selectedDate).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions for this day.
          </p>
        ) : (
          sessions
            .filter((s) => s.date === selectedDate)
            .map((s) => (
              <Link key={s.id} href={`/sessions/${s.id}`}>
                <div className="rounded-2xl border border-white/10 bg-card p-3 backdrop-blur-xl">
                  <span className="text-sm font-medium">
                    Workout — {s.status}
                  </span>
                </div>
              </Link>
            ))
        )}
        <Link href={`/sessions/new?date=${selectedDate}`}>
          <Button className="mt-2 h-10 w-full">
            Start Workout
          </Button>
        </Link>
      </div>
    </div>
  );
}
