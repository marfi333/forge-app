"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Template {
  id: string;
  name: string;
}

export function NewSession() {
  const router = useRouter();
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
      router.push(`/sessions/${data.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/calendar">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold tracking-tight">Start Workout</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Date: {new Date(`${date}T12:00:00`).toLocaleDateString()}
      </p>

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">
          From Template
        </h2>

        {isLoading && (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
              />
            ))}
          </div>
        )}

        {!isLoading && templates.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No templates yet.{" "}
            <Link href="/templates" className="text-primary underline">
              Create one
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
                Start
              </Button>
            </CardContent>
          </Card>
        ))}

        <div className="pt-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Or start blank
          </h2>
          <Button
            className="w-full"
            onClick={() => createSession.mutate(undefined)}
            disabled={createSession.isPending}
          >
            <Plus data-icon="inline-start" />
            {createSession.isPending ? "Creating..." : "Empty Workout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
