"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dumbbell, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { MuscleGroup, Weekday } from "@/lib/constants";
import { MUSCLE_GROUPS, WEEKDAYS } from "@/lib/constants";

interface Template {
  id: string;
  name: string;
  weekday: string | null;
  muscleGroup: string | null;
  createdAt: string;
}

interface TemplateFormData {
  name: string;
  weekday: Weekday | null;
  muscleGroup: MuscleGroup | null;
}

function TemplateFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
  isPending,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial: TemplateFormData;
  onSubmit: (data: TemplateFormData) => void;
  isPending: boolean;
  trigger?: React.ReactElement;
}) {
  const t = useTranslations("templates");
  const tc = useTranslations("common");
  const [form, setForm] = useState<TemplateFormData>(initial);

  function handleOpenChange(next: boolean) {
    if (next) setForm(initial);
    onOpenChange(next);
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
              htmlFor="template-name"
              className="mb-2 block text-sm font-medium text-muted-foreground"
            >
              {t("name")}
            </label>
            <Input
              id="template-name"
              placeholder={t("namePlaceholder")}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              {t("weekday")}
            </span>
            <select
              value={form.weekday ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  weekday: (e.target.value || null) as Weekday | null,
                })
              }
              className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat px-3 py-2 pr-9 text-base text-foreground backdrop-blur-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">{t("noWeekday")}</option>
              {WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-muted-foreground">
              {t("muscleGroup")}
            </span>
            <select
              value={form.muscleGroup ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  muscleGroup: (e.target.value || null) as MuscleGroup | null,
                })
              }
              className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-white/5 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_12px_center] bg-no-repeat px-3 py-2 pr-9 text-base text-foreground backdrop-blur-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value="">{t("noMuscleGroup")}</option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </label>

          <DialogFooter>
            <Button type="submit" disabled={!form.name.trim() || isPending}>
              {isPending ? tc("saving") : tc("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateList() {
  const t = useTranslations("templates");
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(
    null,
  );

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TemplateFormData>;
    }) => {
      const res = await fetch(`/api/templates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setEditingTemplate(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setDeletingTemplateId(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <TemplateFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          title={t("newTemplate")}
          initial={{ name: "", weekday: null, muscleGroup: null }}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          trigger={
            <Button>
              <Plus data-icon="inline-start" />
              {t("new")}
            </Button>
          }
        />
      </div>

      {templates?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Dumbbell className="size-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("noTemplatesYet")}</p>
          <p className="text-sm text-muted-foreground">
            {t("createFirstTemplate")}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {templates?.map((template) => (
          <Card key={template.id} size="sm">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <Link
                href={`/templates/${template.id}`}
                className="min-w-0 flex-1"
              >
                <CardTitle className="truncate">{template.name}</CardTitle>
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
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Pencil className="text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeletingTemplateId(template.id)}
                >
                  <Trash2 className="text-muted-foreground" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <ConfirmDeleteDialog
        open={!!deletingTemplateId}
        onOpenChange={(open) => {
          if (!open) setDeletingTemplateId(null);
        }}
        title={t("deleteTemplate")}
        description={t("deleteTemplateConfirmation")}
        onConfirm={() => {
          if (deletingTemplateId) deleteMutation.mutate(deletingTemplateId);
        }}
        isPending={deleteMutation.isPending}
      />

      {editingTemplate && (
        <TemplateFormDialog
          open={!!editingTemplate}
          onOpenChange={(open) => {
            if (!open) setEditingTemplate(null);
          }}
          title={t("editTemplate")}
          initial={{
            name: editingTemplate.name,
            weekday: (editingTemplate.weekday as Weekday) ?? null,
            muscleGroup: (editingTemplate.muscleGroup as MuscleGroup) ?? null,
          }}
          onSubmit={(data) =>
            updateMutation.mutate({ id: editingTemplate.id, data })
          }
          isPending={updateMutation.isPending}
        />
      )}
    </div>
  );
}
