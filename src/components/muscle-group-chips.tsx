"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MuscleGroup {
  id: string;
  name: string;
  isSystem: boolean;
  userId: string | null;
}

export function MuscleGroupChips({
  exerciseId,
  selectedIds,
  onSelectionChange,
}: {
  exerciseId: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}) {
  const t = useTranslations("muscleGroups");
  const tc = useTranslations("common");
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: muscleGroups = [] } = useQuery<MuscleGroup[]>({
    queryKey: ["muscle-groups"],
    queryFn: async () => {
      const res = await fetch("/api/muscle-groups");
      if (!res.ok) throw new Error("Failed to fetch muscle groups");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/muscle-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create muscle group");
      return res.json() as Promise<MuscleGroup>;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["muscle-groups"] });
      onSelectionChange([...selectedIds, created.id]);
      setNewName("");
      setShowAdd(false);
    },
  });

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }

  function displayName(group: MuscleGroup) {
    if (group.isSystem) {
      return t(group.name);
    }
    return group.name;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {muscleGroups.map((group) => {
          const selected = selectedIds.includes(group.id);
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => toggle(group.id)}
              className={`min-h-11 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {displayName(group)}
            </button>
          );
        })}
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex min-h-11 items-center gap-1 rounded-full bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            <Plus className="size-3.5" />
            {tc("add")}
          </button>
        )}
      </div>
      {showAdd && (
        <div className="mt-2 flex gap-2">
          <Input
            placeholder={t("customPlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                e.preventDefault();
                createMutation.mutate(newName.trim());
              }
              if (e.key === "Escape") setShowAdd(false);
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={!newName.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(newName.trim())}
          >
            {tc("add")}
          </Button>
        </div>
      )}
    </div>
  );
}

export function MuscleGroupBadges({
  muscleGroups,
}: {
  muscleGroups: MuscleGroup[];
}) {
  const t = useTranslations("muscleGroups");

  if (muscleGroups.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {muscleGroups.map((group) => (
        <span
          key={group.id}
          className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {group.isSystem ? t(group.name) : group.name}
        </span>
      ))}
    </div>
  );
}
