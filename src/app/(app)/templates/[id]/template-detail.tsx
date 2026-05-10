"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, GripVertical, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
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

interface Exercise {
  id: string;
  templateId: string;
  name: string;
  order: number;
}

interface TemplateWithExercises {
  id: string;
  name: string;
  createdAt: string;
  exercises: Exercise[];
}

function SortableExercise({
  exercise,
  index,
  onDelete,
  isDeleting,
}: {
  exercise: Exercise;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const { ref, isDragging } = useSortable({
    id: exercise.id,
    index,
  });

  return (
    <Card
      ref={ref}
      size="sm"
      className={isDragging ? "z-10 opacity-50 shadow-lg" : ""}
    >
      <CardContent className="flex items-center gap-3 py-0">
        <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
        <span className="flex-1 font-medium">{exercise.name}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(exercise.id)}
          disabled={isDeleting}
        >
          <Trash2 className="text-muted-foreground" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [localExercises, setLocalExercises] = useState<Exercise[] | null>(null);
  const previousExercises = useRef<Exercise[]>([]);

  const { data: template, isLoading } = useQuery<TemplateWithExercises>({
    queryKey: ["templates", templateId],
    queryFn: async () => {
      const res = await fetch(`/api/templates/${templateId}`);
      if (!res.ok) throw new Error("Failed to fetch template");
      return res.json();
    },
  });

  const exercises = localExercises ?? template?.exercises ?? [];

  const renameMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setEditingName(false);
    },
  });

  const addExerciseMutation = useMutation({
    mutationFn: async (name: string) => {
      const order = exercises.length;
      const res = await fetch(`/api/templates/${templateId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, order }),
      });
      if (!res.ok) throw new Error("Failed to add exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      setAddOpen(false);
      setExerciseName("");
    },
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      const res = await fetch(
        `/api/templates/${templateId}/exercises/${exerciseId}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete exercise");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const res = await fetch(
        `/api/templates/${templateId}/exercises/reorder`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds }),
        },
      );
      if (!res.ok) throw new Error("Failed to reorder exercises");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      setLocalExercises(null);
    },
    onError: () => {
      setLocalExercises(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-muted"
          />
        ))}
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">Template not found</p>
        <Link href="/templates">
          <Button variant="outline" size="sm">
            Back to templates
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/templates"
          className="inline-flex h-11 items-center gap-1 -ml-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        {editingName ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (nameValue.trim()) renameMutation.mutate(nameValue.trim());
            }}
          >
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              autoFocus
              className="text-xl font-bold"
            />
            <Button size="sm" type="submit" disabled={!nameValue.trim()}>
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setEditingName(false)}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <button
            type="button"
            className="block text-left text-xl font-bold tracking-tight"
            onClick={() => {
              setNameValue(template.name);
              setEditingName(true);
            }}
          >
            {template.name}
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </h2>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger
            render={
              <Button size="sm" variant="outline">
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
                  addExerciseMutation.mutate(exerciseName.trim());
              }}
            >
              <Input
                placeholder="e.g. Bench Press, Squat, Deadlift..."
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                autoFocus
              />
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={
                    !exerciseName.trim() || addExerciseMutation.isPending
                  }
                >
                  {addExerciseMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">No exercises yet</p>
          <p className="text-sm text-muted-foreground">
            Add exercises to define your workout routine.
          </p>
        </div>
      )}

      <DragDropProvider
        onDragStart={() => {
          previousExercises.current = exercises;
        }}
        onDragOver={(event) => {
          setLocalExercises((current) => move(current ?? exercises, event));
        }}
        onDragEnd={(event) => {
          if (event.canceled) {
            setLocalExercises(null);
            return;
          }
          const finalOrder = localExercises ?? exercises;
          const ids = finalOrder.map((e) => e.id);
          const originalIds = (template?.exercises ?? []).map((e) => e.id);
          const changed = ids.some((id, i) => id !== originalIds[i]);
          if (changed) {
            reorderMutation.mutate(ids);
          } else {
            setLocalExercises(null);
          }
        }}
      >
        <div className="space-y-2">
          {exercises.map((exercise, index) => (
            <SortableExercise
              key={exercise.id}
              exercise={exercise}
              index={index}
              onDelete={(id) => deleteExerciseMutation.mutate(id)}
              isDeleting={deleteExerciseMutation.isPending}
            />
          ))}
        </div>
      </DragDropProvider>
    </div>
  );
}
