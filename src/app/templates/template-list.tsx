"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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

interface Template {
  id: string;
  name: string;
  createdAt: string;
}

export function TemplateList() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["templates"],
    queryFn: async () => {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to create template");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      setCreateOpen(false);
      setNewName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Header />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-xl bg-card ring-1 ring-foreground/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus data-icon="inline-start" />
                New
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Template</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newName.trim()) createMutation.mutate(newName.trim());
              }}
            >
              <Input
                placeholder="e.g. Push Day, Pull Day, Legs..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
              />
              <DialogFooter className="mt-4">
                <Button
                  type="submit"
                  disabled={!newName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {templates?.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <p className="text-muted-foreground">No templates yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first workout template to get started.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {templates?.map((template) => (
          <Card key={template.id} size="sm">
            <CardHeader className="flex-row items-center justify-between">
              <Link href={`/templates/${template.id}`} className="flex-1">
                <CardTitle>{template.name}</CardTitle>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteMutation.mutate(template.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="text-muted-foreground" />
              </Button>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Header() {
  return <h1 className="text-2xl font-bold tracking-tight">Templates</h1>;
}
