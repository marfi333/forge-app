"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GripVertical,
  Image as ImageIcon,
  Info,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { YouTubePlayer } from "@/components/youtube-player";

interface Exercise {
  id: string;
  templateId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  youtubeUrl: string | null;
  order: number;
}

interface TemplateWithExercises {
  id: string;
  name: string;
  weekday: string | null;
  muscleGroup: string | null;
  createdAt: string;
  exercises: Exercise[];
}

interface ExerciseFormData {
  name: string;
  description: string;
  imageUrl: string;
  youtubeUrl: string;
}

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  description: "",
  imageUrl: "",
  youtubeUrl: "",
};

function ExerciseFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  isPending,
  templateId,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial: ExerciseFormData;
  onSubmit: (data: ExerciseFormData) => void;
  isPending: boolean;
  templateId: string;
  trigger?: React.ReactElement;
}) {
  const [form, setForm] = useState<ExerciseFormData>(initial);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleOpenChange(next: boolean) {
    if (next) setForm(initial);
    onOpenChange(next);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/image", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { url: string };
      setForm((prev) => ({ ...prev, imageUrl: data.url }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim()) onSubmit({ ...form, name: form.name.trim() });
          }}
        >
          <div>
            <label
              htmlFor={`exercise-name-${templateId}`}
              className="mb-2 block text-sm font-medium text-muted-foreground"
            >
              Name
            </label>
            <Input
              id={`exercise-name-${templateId}`}
              placeholder="e.g. Bench Press, Squat, Deadlift..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              Description
            </span>
            <textarea
              placeholder="Exercise instructions or notes..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base text-foreground outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              Image
            </span>
            <div className="flex gap-2">
              <Input
                placeholder="Image URL or upload a file"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="flex-1"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload />
              </Button>
            </div>
            {uploading && (
              <p className="text-xs text-muted-foreground">Uploading…</p>
            )}
            {form.imageUrl && !uploading && (
              /* biome-ignore lint/performance/noImgElement: user-provided dynamic URLs */
              <img
                src={form.imageUrl}
                alt="Exercise preview"
                className="h-32 w-full rounded-xl object-cover"
              />
            )}
          </div>

          <div>
            <label
              htmlFor={`exercise-youtube-${templateId}`}
              className="mb-2 block text-sm font-medium text-muted-foreground"
            >
              YouTube URL
            </label>
            <Input
              id={`exercise-youtube-${templateId}`}
              placeholder="https://youtube.com/watch?v=..."
              value={form.youtubeUrl}
              onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
            />
            {form.youtubeUrl && <YouTubePlayer url={form.youtubeUrl} />}
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={!form.name.trim() || isPending || uploading}
            >
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SortableExercise({
  exercise,
  index,
  templateId,
  onEdit,
  onDelete,
  isDeleting,
}: {
  exercise: Exercise;
  index: number;
  templateId: string;
  onEdit: () => void;
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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{exercise.name}</span>
            {exercise.imageUrl && (
              <ImageIcon className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            {exercise.youtubeUrl && (
              <Video className="size-3.5 shrink-0 text-muted-foreground" />
            )}
          </div>
          {exercise.description && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {exercise.description}
            </p>
          )}
        </div>
        {exercise.imageUrl && (
          /* biome-ignore lint/performance/noImgElement: user-provided dynamic URLs */
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            className="size-10 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/templates/${templateId}/exercises/${exercise.id}`}>
            <Button variant="ghost" size="icon-sm">
              <Info className="text-muted-foreground" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(exercise.id)}
            disabled={isDeleting}
          >
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [localExercises, setLocalExercises] = useState<Exercise[] | null>(null);

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
    mutationFn: async (data: ExerciseFormData) => {
      const order = exercises.length;
      const res = await fetch(`/api/templates/${templateId}/exercises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          youtubeUrl: data.youtubeUrl || null,
          order,
        }),
      });
      if (!res.ok) throw new Error("Failed to add exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      setAddOpen(false);
    },
  });

  const updateExerciseMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ExerciseFormData;
    }) => {
      const res = await fetch(`/api/templates/${templateId}/exercises/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || null,
          imageUrl: data.imageUrl || null,
          youtubeUrl: data.youtubeUrl || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update exercise");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      setEditingExercise(null);
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
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({
        queryKey: ["templates", templateId],
      });
      const previous = queryClient.getQueryData<TemplateWithExercises>([
        "templates",
        templateId,
      ]);
      if (previous) {
        const reordered = orderedIds
          .map((id, idx) => {
            const ex = previous.exercises.find((e) => e.id === id);
            return ex ? { ...ex, order: idx } : null;
          })
          .filter((e): e is Exercise => e !== null);
        queryClient.setQueryData<TemplateWithExercises>(
          ["templates", templateId],
          { ...previous, exercises: reordered },
        );
      }
      return { previous };
    },
    onSuccess: (_data, orderedIds) => {
      const current = queryClient.getQueryData<TemplateWithExercises>([
        "templates",
        templateId,
      ]);
      if (current) {
        const reordered = orderedIds
          .map((id, idx) => {
            const ex = current.exercises.find((e) => e.id === id);
            return ex ? { ...ex, order: idx } : null;
          })
          .filter((e): e is Exercise => e !== null);
        queryClient.setQueryData<TemplateWithExercises>(
          ["templates", templateId],
          { ...current, exercises: reordered },
        );
      }
      setLocalExercises(null);
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["templates", templateId], context.previous);
      }
      setLocalExercises(null);
      toast.error("Failed to reorder exercises");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
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
          className="-ml-1 inline-flex h-11 items-center gap-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        {editingName ? (
          <form
            className="flex items-center gap-2"
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
          <div>
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
            <div className="mt-1 flex items-center gap-2">
              {template.weekday && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {template.weekday}
                </span>
              )}
              {template.muscleGroup && (
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {template.muscleGroup}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {exercises.length} {exercises.length === 1 ? "exercise" : "exercises"}
        </h2>
        <ExerciseFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          title="Add Exercise"
          initial={EMPTY_FORM}
          onSubmit={(data) => addExerciseMutation.mutate(data)}
          isPending={addExerciseMutation.isPending}
          templateId={templateId}
          trigger={
            <Button size="sm" variant="outline">
              <Plus data-icon="inline-start" />
              Add Exercise
            </Button>
          }
        />
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
            setLocalExercises(null);
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
              templateId={templateId}
              onEdit={() => setEditingExercise(exercise)}
              onDelete={(id) => deleteExerciseMutation.mutate(id)}
              isDeleting={deleteExerciseMutation.isPending}
            />
          ))}
        </div>
      </DragDropProvider>

      {editingExercise && (
        <ExerciseFormDialog
          open={!!editingExercise}
          onOpenChange={(open) => {
            if (!open) setEditingExercise(null);
          }}
          title="Edit Exercise"
          initial={{
            name: editingExercise.name,
            description: editingExercise.description ?? "",
            imageUrl: editingExercise.imageUrl ?? "",
            youtubeUrl: editingExercise.youtubeUrl ?? "",
          }}
          onSubmit={(data) =>
            updateExerciseMutation.mutate({ id: editingExercise.id, data })
          }
          isPending={updateExerciseMutation.isPending}
          templateId={templateId}
        />
      )}
    </div>
  );
}
