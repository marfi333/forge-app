"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormatter, useTranslations } from "next-intl";
import { useHaptics } from "@/components/haptics-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { invalidateWorkoutDependentQueries } from "@/lib/query-invalidation";

interface Template {
  id: string;
  name: string;
}

export function NewSession() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { trigger } = useHaptics();
  const searchParams = useSearchParams();
  const date =
    searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createSession = useMutation({
    mutationFn: async (templateId?: string) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, templateId }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      invalidateWorkoutDependentQueries(queryClient);
      router.push(`/sessions/${data.id}`);
    },
  });

  const t = useTranslations("sessions");
  const tc = useTranslations("common");
  const format = useFormatter();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/calendar"
          onClick={() => trigger("light")}
          className="inline-flex h-11 items-center gap-1 -ml-1 px-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {tc("back")}
        </Link>
        <h1 className="text-xl font-bold tracking-tight">
          {t("startWorkout")}
        </h1>
      </div>

      <p className="text-sm text-muted-foreground">
        {format.dateTime(new Date(`${date}T12:00:00`), {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("fromTemplate")}
        </h2>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-2xl bg-muted"
              />
            ))}
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {t("noTemplatesYet")}{" "}
            <Link href="/templates" className="text-primary underline">
              {t("createOne")}
            </Link>
          </p>
        )}

        {templates.map((template) => (
          <Card key={template.id} size="sm">
            <CardContent className="flex items-center gap-3 py-0">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 font-medium">{template.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => createSession.mutate(template.id)}
                disabled={createSession.isPending}
              >
                {t("start")}
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="pt-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            {t("orStartBlank")}
          </h2>
          <Button
            className="h-10 w-full"
            onClick={() => createSession.mutate(undefined)}
            disabled={createSession.isPending}
          >
            <Plus data-icon="inline-start" />
            {createSession.isPending ? t("creating") : t("emptyWorkout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
