"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Timer,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { invalidateWorkoutDependentQueries } from "@/lib/query-invalidation";

interface ExerciseSet {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  reps: number | null;
  weight: number | null;
  completed: boolean;
}

interface SessionExercise {
  id: string;
  sessionId: string;
  name: string;
  order: number;
  sets: ExerciseSet[];
}

interface WorkoutSession {
  id: string;
  userId: string;
  date: string;
  templateId: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  exercises: SessionExercise[];
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.max(
      0,
      Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
    ),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(
        Math.max(
          0,
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
        ),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Timer className="size-4" />
      <span className="text-lg font-mono font-semibold tabular-nums">
        {minutes}:{seconds}
      </span>
    </div>
  );
}

function ExerciseVolume({ sets }: { sets: ExerciseSet[] }) {
  const volume = sets
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);

  const completedSets = sets.filter((s) => s.completed).length;

  return (
    <p className="text-sm text-muted-foreground">
      {completedSets} set{completedSets !== 1 ? "s" : ""} totaling{" "}
      <span className="text-foreground font-medium">
        {volume.toLocaleString()} kg
      </span>
    </p>
  );
}

function CompactSetRow({
  set,
  sessionId,
  exerciseId,
}: {
  set: ExerciseSet;
  sessionId: string;
  exerciseId: string;
}) {
  const queryClient = useQueryClient();
  const [reps, setReps] = useState(String(set.reps ?? ""));
  const [weight, setWeight] = useState(String(set.weight ?? ""));
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setReps(String(set.reps ?? ""));
    setWeight(String(set.weight ?? ""));
  }, [set.reps, set.weight]);

  const updateSet = useMutation({
    mutationFn: async (data: Partial<ExerciseSet>) => {
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exerciseId}/sets/${set.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );
      if (!res.ok) throw new Error("Failed to update set");
      return res.json();
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({
        queryKey: ["sessions", sessionId],
      });
      const prev = queryClient.getQueryData<WorkoutSession>([
        "sessions",
        sessionId,
      ]);
      if (prev) {
        queryClient.setQueryData<WorkoutSession>(["sessions", sessionId], {
          ...prev,
          exercises: prev.exercises.map((ex) =>
            ex.id === exerciseId
              ? {
                  ...ex,
                  sets: ex.sets.map((s) =>
                    s.id === set.id ? { ...s, ...data } : s,
                  ),
                }
              : ex,
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _data, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["sessions", sessionId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
    },
  });

  const deleteSet = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exerciseId}/sets/${set.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete set");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
    },
  });

  function commitEdits() {
    const newWeight = weight === "" ? undefined : Number(weight);
    const newReps = reps === "" ? undefined : Number(reps);
    const updates: Partial<ExerciseSet> = {};

    if (
      newWeight !== undefined &&
      !Number.isNaN(newWeight) &&
      newWeight !== set.weight
    ) {
      updates.weight = newWeight;
    }
    if (
      newReps !== undefined &&
      !Number.isNaN(newReps) &&
      newReps !== set.reps
    ) {
      updates.reps = newReps;
    }
    if (Object.keys(updates).length > 0) {
      updateSet.mutate(updates);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-card/60 backdrop-blur-md px-4 py-3">
        <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
          {set.setNumber}
        </span>
        <Input
          className="h-8 w-16 text-center text-sm"
          placeholder="kg"
          inputMode="decimal"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          autoFocus
        />
        <span className="text-sm text-muted-foreground">×</span>
        <Input
          className="h-8 w-16 text-center text-sm"
          placeholder="reps"
          inputMode="numeric"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
        />
        <Button variant="default" size="icon-sm" onClick={commitEdits}>
          <Check className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => deleteSet.mutate()}
          disabled={deleteSet.isPending}
        >
          <Minus className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-card/60 backdrop-blur-md px-4 py-3 min-h-[48px]">
      <button
        type="button"
        className="flex flex-1 items-center gap-3 cursor-pointer bg-transparent border-none p-0 text-left"
        onClick={() => setEditing(true)}
      >
        <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
          {set.setNumber}
        </span>
        <span className="flex-1 text-sm font-medium">
          {set.weight ?? "—"} kg × {set.reps ?? "—"}
        </span>
      </button>
      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon-sm"
        className="shrink-0"
        onClick={() => updateSet.mutate({ completed: !set.completed })}
      >
        <Check className="size-3.5" />
      </Button>
    </div>
  );
}

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [addExOpen, setAddExOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [deleteExConfirmOpen, setDeleteExConfirmOpen] = useState(false);

  const { data: session, isLoading } = useQuery<WorkoutSession>({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
  });

  const addExercise = useMutation({
    mutationFn: async (name: string) => {
      const order = session?.exercises.length ?? 0;
      const res = await fetch(`/api/sessions/${sessionId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order }),
      });
      if (!res.ok) throw new Error("Failed to add exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
      setAddExOpen(false);
      setExerciseName("");
      if (session) {
        setCurrentExerciseIndex(session.exercises.length);
      }
    },
  });

  const deleteExercise = useMutation({
    mutationFn: async (exerciseId: string) => {
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exerciseId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete exercise");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
      setDeleteExConfirmOpen(false);
      if (
        session &&
        currentExerciseIndex >= session.exercises.length - 1 &&
        currentExerciseIndex > 0
      ) {
        setCurrentExerciseIndex(currentExerciseIndex - 1);
      }
    },
  });

  const addSet = useMutation({
    mutationFn: async (exerciseId: string) => {
      const exercise = session?.exercises.find((e) => e.id === exerciseId);
      const nextSetNumber = (exercise?.sets.length ?? 0) + 1;
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exerciseId}/sets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setNumber: nextSetNumber }),
        },
      );
      if (!res.ok) throw new Error("Failed to add set");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
    },
  });

  const completeSession = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) throw new Error("Failed to complete session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Session not found</p>
        <Link href="/calendar">
          <Button variant="outline" size="sm">
            Back to calendar
          </Button>
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === "completed";
  const exercises = session.exercises;
  const safeIndex = Math.min(currentExerciseIndex, exercises.length - 1);
  const currentExercise = exercises[safeIndex];
  const hasExercises = exercises.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header: Back + Timer */}
      <div className="flex items-center justify-between">
        <Link
          href="/calendar"
          className="inline-flex h-11 items-center gap-1 -ml-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Back
        </Link>
        {!isCompleted && <ElapsedTimer startedAt={session.createdAt} />}
        {isCompleted && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <Check className="size-4" />
            Completed
          </span>
        )}
      </div>

      {hasExercises && currentExercise ? (
        <>
          {/* Exercise Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              disabled={safeIndex === 0}
              onClick={() => setCurrentExerciseIndex(safeIndex - 1)}
            >
              <ChevronLeft className="size-5" />
            </Button>

            <div className="flex flex-col items-center text-center">
              <h1 className="text-xl font-bold tracking-tight">
                {currentExercise.name}
              </h1>
              <span className="text-sm text-muted-foreground">
                {safeIndex + 1} / {exercises.length}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              disabled={safeIndex === exercises.length - 1}
              onClick={() => setCurrentExerciseIndex(safeIndex + 1)}
            >
              <ChevronRight className="size-5" />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center justify-between">
            <ExerciseVolume sets={currentExercise.sets} />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteExConfirmOpen(true)}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
            <ConfirmDeleteDialog
              open={deleteExConfirmOpen}
              onOpenChange={setDeleteExConfirmOpen}
              title="Delete exercise"
              description={`Are you sure you want to delete "${currentExercise.name}" and all its sets? This action cannot be undone.`}
              onConfirm={() => deleteExercise.mutate(currentExercise.id)}
              isPending={deleteExercise.isPending}
            />
          </div>

          {/* Set Rows */}
          <div className="space-y-2">
            {currentExercise.sets.map((set) => (
              <CompactSetRow
                key={set.id}
                set={set}
                sessionId={sessionId}
                exerciseId={currentExercise.id}
              />
            ))}
          </div>

          {/* Add Set */}
          <Button
            variant="outline"
            className="w-full rounded-xl border-dashed border-white/10"
            onClick={() => addSet.mutate(currentExercise.id)}
            disabled={addSet.isPending}
          >
            <Plus data-icon="inline-start" />
            Add Set
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No exercises yet</p>
          <p className="text-sm text-muted-foreground">
            Add an exercise to start logging sets.
          </p>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex gap-2 mt-auto pt-4">
        <Dialog open={addExOpen} onOpenChange={setAddExOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" className="flex-1 rounded-xl">
                <Plus data-icon="inline-start" />
                Add Exercise
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Exercise</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (exerciseName.trim())
                  addExercise.mutate(exerciseName.trim());
              }}
            >
              <Input
                placeholder="e.g. Bench Press, Squat..."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                autoFocus
              />
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={!exerciseName.trim() || addExercise.isPending}
                >
                  {addExercise.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {!isCompleted && hasExercises && (
          <Button
            className="flex-1 rounded-xl"
            onClick={() => completeSession.mutate()}
            disabled={completeSession.isPending}
          >
            {completeSession.isPending ? "Completing..." : "Complete Workout"}
          </Button>
        )}
      </div>
    </div>
  );
}
