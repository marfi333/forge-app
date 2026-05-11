"use client";

import { move } from "@dnd-kit/helpers";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  GripVertical,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDeleteDrawer } from "@/components/confirm-delete-drawer";
import { useHaptics } from "@/components/haptics-provider";
import { MuscleGroupChips } from "@/components/muscle-group-chips";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
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
  sets: number | null;
  reps: number | null;
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
  muscleGroupIds: string[];
  sets: string;
  reps: string;
}

const EMPTY_FORM: ExerciseFormData = {
  name: "",
  description: "",
  imageUrl: "",
  youtubeUrl: "",
  muscleGroupIds: [],
  sets: "",
  reps: "",
};

function ExerciseFormDrawer({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  isPending,
  templateId,
  exerciseId,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial: ExerciseFormData;
  onSubmit: (data: ExerciseFormData) => void;
  isPending: boolean;
  templateId: string;
  exerciseId?: string;
  trigger?: React.ReactElement;
}) {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
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
    <Drawer open={open} onOpenChange={handleOpenChange}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim()) onSubmit({ ...form, name: form.name.trim() });
          }}
        >
          <DrawerBody className="space-y-4">
            <div>
              <label
                htmlFor={`exercise-name-${templateId}`}
                className="mb-2 block text-sm font-medium text-muted-foreground"
              >
                {t("exerciseName")}
              </label>
              <Input
                id={`exercise-name-${templateId}`}
                placeholder={t("exerciseNamePlaceholder")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor={`exercise-sets-${templateId}`}
                  className="mb-2 block text-sm font-medium text-muted-foreground"
                >
                  {t("sets")}
                </label>
                <Input
                  id={`exercise-sets-${templateId}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="—"
                  value={form.sets}
                  onChange={(e) => setForm({ ...form, sets: e.target.value })}
                />
              </div>
              <div>
                <label
                  htmlFor={`exercise-reps-${templateId}`}
                  className="mb-2 block text-sm font-medium text-muted-foreground"
                >
                  {t("reps")}
                </label>
                <Input
                  id={`exercise-reps-${templateId}`}
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="—"
                  value={form.reps}
                  onChange={(e) => setForm({ ...form, reps: e.target.value })}
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-muted-foreground">
                {t("description")}
              </span>
              <textarea
                placeholder={t("descriptionPlaceholder")}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full min-w-0 rounded-xl border border-border bg-muted/50 px-3 py-2 text-base text-foreground outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-medium text-muted-foreground">
                {t("image")}
              </span>
              <div className="flex gap-2">
                <Input
                  placeholder={t("imagePlaceholder")}
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
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
                <p className="text-xs text-muted-foreground">
                  {t("uploading")}
                </p>
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
                {t("youtubeUrl")}
              </label>
              <Input
                id={`exercise-youtube-${templateId}`}
                placeholder="https://youtube.com/watch?v=..."
                value={form.youtubeUrl}
                onChange={(e) =>
                  setForm({ ...form, youtubeUrl: e.target.value })
                }
              />
              {form.youtubeUrl && <YouTubePlayer url={form.youtubeUrl} />}
            </div>

            {exerciseId && (
              <div>
                <span className="mb-2 block text-sm font-medium text-muted-foreground">
                  {t("muscleGroups")}
                </span>
                <MuscleGroupChips
                  exerciseId={exerciseId}
                  selectedIds={form.muscleGroupIds}
                  onSelectionChange={(ids) =>
                    setForm({ ...form, muscleGroupIds: ids })
                  }
                />
              </div>
            )}
          </DrawerBody>
          <DrawerFooter>
            <Button
              type="submit"
              className="w-full h-12"
              disabled={!form.name.trim() || isPending || uploading}
            >
              {isPending ? tc("saving") : tc("save")}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
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
  const t = useTranslations("templates");
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        <Link href={`/templates/${templateId}/exercises/${exercise.id}`} className="flex min-w-0 flex-1 items-center gap-3">
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
            {(exercise.sets || exercise.reps) && (
              <p className="mt-0.5 text-xs font-medium text-primary">
                {exercise.sets && exercise.reps
                  ? `${exercise.sets} × ${exercise.reps}`
                  : exercise.sets
                    ? `${exercise.sets} sets`
                    : `${exercise.reps} reps`}
              </p>
            )}
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
        </Link>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil className="text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="text-red-400" />
          </Button>
        </div>
      </CardContent>
      <ConfirmDeleteDrawer
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("deleteExercise")}
        description={t("deleteExerciseConfirmation", { name: exercise.name })}
        onConfirm={() => {
          onDelete(exercise.id);
          setConfirmOpen(false);
        }}
        isPending={isDeleting}
      />
    </Card>
  );
}

function EditExerciseDrawer({
  exercise,
  templateId,
  onClose,
  onSubmit,
  isPending,
}: {
  exercise: Exercise;
  templateId: string;
  onClose: () => void;
  onSubmit: (data: ExerciseFormData) => void;
  isPending: boolean;
}) {
  const t = useTranslations("templates");

  const { data: muscleGroupIds, isLoading } = useQuery<string[]>({
    queryKey: ["exercise-muscle-group-ids", exercise.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/template-exercises/${exercise.id}/muscle-groups`,
      );
      if (!res.ok) return [];
      const groups = (await res.json()) as { id: string }[];
      return groups.map((g) => g.id);
    },
  });

  if (isLoading) return null;

  return (
    <ExerciseFormDrawer
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t("editExercise")}
      initial={{
        name: exercise.name,
        description: exercise.description ?? "",
        imageUrl: exercise.imageUrl ?? "",
        youtubeUrl: exercise.youtubeUrl ?? "",
        muscleGroupIds: muscleGroupIds ?? [],
        sets: exercise.sets?.toString() ?? "",
        reps: exercise.reps?.toString() ?? "",
      }}
      onSubmit={onSubmit}
      isPending={isPending}
      templateId={templateId}
      exerciseId={exercise.id}
    />
  );
}

export function TemplateDetail({ templateId }: { templateId: string }) {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const tm = useTranslations("muscleGroups");
  const queryClient = useQueryClient();
  const { trigger } = useHaptics();
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
          sets: data.sets ? Number(data.sets) : null,
          reps: data.reps ? Number(data.reps) : null,
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
          sets: data.sets ? Number(data.sets) : null,
          reps: data.reps ? Number(data.reps) : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update exercise");

      await fetch(`/api/template-exercises/${id}/muscle-groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ muscleGroupIds: data.muscleGroupIds }),
      });

      return res.json();
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["templates", templateId] });
      queryClient.invalidateQueries({
        queryKey: ["exercise-muscle-group-ids", id],
      });
      queryClient.invalidateQueries({
        queryKey: ["exercise-muscle-groups", id],
      });
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
        <p className="text-muted-foreground">{t("templateNotFound")}</p>
        <Link href="/templates">
          <Button variant="outline" size="sm">
            {t("backToTemplates")}
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
          onClick={() => trigger("light")}
          className="-ml-1 inline-flex h-11 items-center gap-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {tc("back")}
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
              {tc("save")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => setEditingName(false)}
            >
              {tc("cancel")}
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
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {tm(template.muscleGroup)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("exerciseCount", { count: exercises.length })}
        </h2>
        <ExerciseFormDrawer
          open={addOpen}
          onOpenChange={setAddOpen}
          title={t("addExercise")}
          initial={EMPTY_FORM}
          onSubmit={(data) => addExerciseMutation.mutate(data)}
          isPending={addExerciseMutation.isPending}
          templateId={templateId}
          trigger={
            <Button size="sm" variant="outline">
              <Plus data-icon="inline-start" />
              {t("addExercise")}
            </Button>
          }
        />
      </div>

      {exercises.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-muted-foreground">{t("noExercisesYet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("addExercisesPrompt")}
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
          trigger("selection");
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
        <EditExerciseDrawer
          exercise={editingExercise}
          templateId={templateId}
          onClose={() => setEditingExercise(null)}
          onSubmit={(data) =>
            updateExerciseMutation.mutate({ id: editingExercise.id, data })
          }
          isPending={updateExerciseMutation.isPending}
        />
      )}
    </div>
  );
}
