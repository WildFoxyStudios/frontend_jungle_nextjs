"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { UserProject } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Badge } from "@jungle/ui";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function ProjectsSettingsPage() {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", url: "", tags: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    usersApi.getProjects().then(setProjects).catch(() => { /* non-critical: failure is silent */ });
  }, []);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setIsLoading(true);
    try {
      const created = await usersApi.addProject({
        title: form.title,
        description: form.description || undefined,
        url: form.url || undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      setProjects((prev) => [...prev, created]);
      setForm({ title: "", description: "", url: "", tags: "" });
      setIsAdding(false);
      toast.success("Project added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await usersApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button size="sm" onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="h-4 w-4 mr-1" /> Add project
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-1">
              <Label>URL</Label>
              <Input type="url" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="react, typescript, rust" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={isLoading || !form.title.trim()}>
                {isLoading ? "Adding…" : "Add"}
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {projects.map((p) => (
          <Card key={p.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{p.title}</CardTitle>
                  {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{p.url}</a>}
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            {(p.description || p.tags?.length) && (
              <CardContent className="pt-0 space-y-2">
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.tags?.length && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
        {projects.length === 0 && !isAdding && (
          <p className="text-muted-foreground text-sm text-center py-8">No projects yet.</p>
        )}
      </div>
    </div>
  );
}