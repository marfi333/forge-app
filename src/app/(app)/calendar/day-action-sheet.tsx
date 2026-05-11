"use client";

import { Check, Dumbbell, Moon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { useHaptics } from "@/components/haptics-provider";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface Session {
  id: string;
  date: string;
  status: string;
  templateName: string | null;
}

interface DayActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  currentType: "workout" | "rest" | null;
  sessions: Session[];
  onSetType: (type: "workout" | "rest") => void;
  onClear: () => void;
}

export function DayActionSheet({
  open,
  onOpenChange,
  selectedDate,
  currentType,
  sessions,
  onSetType,
  onClear,
}: DayActionSheetProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { trigger } = useHaptics();

  const formattedDate = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "short", day: "numeric" },
  );

  function handleType(type: "workout" | "rest") {
    onSetType(type);
    onOpenChange(false);
  }

  function handleClear() {
    onClear();
    onOpenChange(false);
    setConfirmOpen(false);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        trigger("light");
        onOpenChange(next);
      }}
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{formattedDate}</DrawerTitle>
        </DrawerHeader>

        <div className="flex gap-2 px-4 pb-3">
          <Button
            variant={currentType === "workout" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => handleType("workout")}
          >
            <Dumbbell className="size-4" />
            Workout
          </Button>
          <Button
            variant={currentType === "rest" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => handleType("rest")}
          >
            <Moon className="size-4" />
            Rest Day
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setConfirmOpen(true)}
            disabled={!currentType}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <ConfirmDeleteDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Clear day"
          description="Are you sure you want to clear this day's type? This action cannot be undone."
          onConfirm={handleClear}
        />

        {sessions.length > 0 && (
          <div className="space-y-2 px-4 pb-3">
            <p className="text-xs font-medium text-muted-foreground">
              Sessions
            </p>
            {sessions.map((s) => {
              const isCompleted = s.status === "completed";
              const isInProgress = s.status === "in_progress";
              return (
                <Link key={s.id} href={`/sessions/${s.id}`} className="block">
                  <div
                    className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur-xl transition-colors ${
                      isCompleted
                        ? "border-primary/30 bg-primary/5"
                        : isInProgress
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : "border-white/10 bg-card"
                    }`}
                  >
                    <div
                      className={`flex size-8 items-center justify-center rounded-lg ${
                        isCompleted
                          ? "bg-primary/15 text-primary"
                          : isInProgress
                            ? "bg-yellow-500/15 text-yellow-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        <Dumbbell className="size-4" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {s.templateName || "Workout"}
                      </span>
                      <span
                        className={`text-xs ${
                          isCompleted
                            ? "text-primary"
                            : isInProgress
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isCompleted
                          ? "Completed"
                          : isInProgress
                            ? "In Progress"
                            : s.status}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <DrawerFooter>
          <Link href={`/sessions/new?date=${selectedDate}`} className="w-full">
            <Button className="h-10 w-full">Start Workout</Button>
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
