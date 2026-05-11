"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useHaptics } from "@/components/haptics-provider";
import { MuscleGroupBadges } from "@/components/muscle-group-chips";
import { Button } from "@/components/ui/button";
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

export function ExerciseInfo({
  templateId,
  exerciseId,
}: {
  templateId: string;
  exerciseId: string;
}) {
  const { trigger } = useHaptics();
  const t = useTranslations("templates");
  const tc = useTranslations("common");

  const { data: exercise, isLoading } = useQuery<Exercise>({
    queryKey: ["exercises", templateId, exerciseId],
    queryFn: async () => {
      const res = await fetch(
        `/api/templates/${templateId}/exercises/${exerciseId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch exercise");
      return res.json();
    },
  });

  const { data: muscleGroups = [] } = useQuery<
    { id: string; name: string; isSystem: boolean; userId: string | null }[]
  >({
    queryKey: ["exercise-muscle-groups", exerciseId],
    queryFn: async () => {
      const res = await fetch(
        `/api/template-exercises/${exerciseId}/muscle-groups`,
      );
      if (!res.ok) throw new Error("Failed to fetch muscle groups");
      return res.json();
    },
    enabled: !!exercise,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <p className="text-muted-foreground">{t("exerciseNotFound")}</p>
        <Link href={`/templates/${templateId}`}>
          <Button variant="outline" size="sm">
            {t("backToTemplate")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href={`/templates/${templateId}`}
          onClick={() => trigger("light")}
          className="-ml-1 inline-flex h-11 items-center gap-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {tc("back")}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{exercise.name}</h1>
        <MuscleGroupBadges muscleGroups={muscleGroups} />
      </div>

      {exercise.description && (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {exercise.description}
        </p>
      )}

      {exercise.imageUrl && (
        /* biome-ignore lint/performance/noImgElement: user-provided dynamic URLs */
        <img
          src={exercise.imageUrl}
          alt={exercise.name}
          className="w-full rounded-2xl object-cover"
        />
      )}

      {exercise.youtubeUrl && <YouTubePlayer url={exercise.youtubeUrl} />}
    </div>
  );
}
