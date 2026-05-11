"use client";

import { Check, Dumbbell, Moon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
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
  const t = useTranslations("calendar");
  const tc = useTranslations("common");
  const format = useFormatter();

  const formattedDate = format.dateTime(new Date(`${selectedDate}T12:00:00`), {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

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
    <Drawer open={open} onOpenChange={onOpenChange}>
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
            {tc("workout")}
          </Button>
          <Button
            variant={currentType === "rest" ? "default" : "outline"}
            className="flex-1 gap-2"
            onClick={() => handleType("rest")}
          >
            <Moon className="size-4" />
            {t("restDay")}
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
          title={t("clearDay")}
          description={t("clearDayConfirmation")}
          onConfirm={handleClear}
        />

        {sessions.length > 0 && (
          <div className="space-y-2 px-4 pb-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("sessions")}
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
                        {s.templateName || tc("workout")}
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
                          ? t("completed")
                          : isInProgress
                            ? t("inProgress")
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
            <Button className="h-10 w-full">{t("startWorkout")}</Button>
          </Link>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
