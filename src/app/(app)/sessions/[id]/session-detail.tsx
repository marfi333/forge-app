"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Minus,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  exercises: SessionExercise[];
}

function SetRow({
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

  function handleBlur(field: "reps" | "weight", value: string) {
    const num = value === "" ? undefined : Number(value);
    if (num !== undefined && Number.isNaN(num)) return;
    if (
      (field === "reps" && num === set.reps) ||
      (field === "weight" && num === set.weight)
    )
      return;
    updateSet.mutate({ [field]: num });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">
        {set.setNumber}
      </span>
      <Input
        className="h-8 w-16 text-center text-sm"
        placeholder="kg"
        inputMode="decimal"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={() => handleBlur("weight", weight)}
      />
      <span className="text-xs text-muted-foreground">x</span>
      <Input
        className="h-8 w-16 text-center text-sm"
        placeholder="reps"
        inputMode="numeric"
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={() => handleBlur("reps", reps)}
      />
      <Button
        variant={set.completed ? "default" : "outline"}
        size="icon-sm"
        onClick={() => updateSet.mutate({ completed: !set.completed })}
      >
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

function ExerciseCard({
  exercise,
  sessionId,
}: {
  exercise: SessionExercise;
  sessionId: string;
}) {
  const queryClient = useQueryClient();

  const addSet = useMutation({
    mutationFn: async () => {
      const nextSetNumber = exercise.sets.length + 1;
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exercise.id}/sets`,
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

  const deleteExercise = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/sessions/${sessionId}/exercises/${exercise.id}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete exercise");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId],
      });
      invalidateWorkoutDependentQueries(queryClient);
    },
  });

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{exercise.name}</h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => deleteExercise.mutate()}
            disabled={deleteExercise.isPending}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>

        {exercise.sets.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-6 text-center">Set</span>
            <span className="w-16 text-center">Weight</span>
            <span />
            <span className="w-16 text-center">Reps</span>
          </div>
        )}

        <div className="space-y-1.5">
          {exercise.sets.map((set) => (
            <SetRow
              key={set.id}
              set={set}
              sessionId={sessionId}
              exerciseId={exercise.id}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => addSet.mutate()}
          disabled={addSet.isPending}
        >
          <Plus data-icon="inline-start" />
          Add Set
        </Button>
      </CardContent>
    </Card>
  );
}

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const queryClient = useQueryClient();
  const [addExOpen, setAddExOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState("");

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
        {[1, 2].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/calendar"
          className="inline-flex h-11 items-center gap-1 -ml-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Workout</h1>
            <p className="text-sm text-muted-foreground">
              {new Date(`${session.date}T12:00:00`).toLocaleDateString()}
            </p>
          </div>
          {isCompleted && (
            <span className="flex items-center gap-1 text-sm text-primary">
              <CheckCircle2 className="size-4" />
              Done
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {session.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            sessionId={sessionId}
          />
        ))}
      </div>

      {session.exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No exercises yet</p>
          <p className="text-sm text-muted-foreground">
            Add exercises to start logging sets.
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Dialog open={addExOpen} onOpenChange={setAddExOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" className="flex-1">
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

        {!isCompleted && session.exercises.length > 0 && (
          <Button
            className="flex-1"
            onClick={() => completeSession.mutate()}
            disabled={completeSession.isPending}
          >
            <CheckCircle2 data-icon="inline-start" />
            {completeSession.isPending ? "Completing..." : "Complete"}
          </Button>
        )}
      </div>
    </div>
  );
}
