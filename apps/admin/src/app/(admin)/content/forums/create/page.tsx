"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@jungle/ui";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CreateForumPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    section_id: "",
    is_private: false,
    sort_order: 0,
  });

  const { data: sections } = useQuery({
    queryKey: ["admin", "forum-sections"],
    queryFn: () => adminApi.getForumSections(),
  });

  const create = useMutation({
    mutationFn: () =>
      adminApi.createAdminForum({
        name: form.name,
        description: form.description || undefined,
        section_id: form.section_id ? Number(form.section_id) : undefined,
        is_private: form.is_private,
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      toast.success("Forum created");
      router.push("/content/forums");
    },
    onError: () => toast.error("Failed to create forum"),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <AdminPageShell title="Create Forum" description="Add a new forum under a section.">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Forum details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Name *</Label>
            <Input id="f-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Announcements" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-desc">Description</Label>
            <Input id="f-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-section">Section</Label>
            <select
              id="f-section"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              value={form.section_id}
              onChange={(e) => set("section_id", e.target.value)}
            >
              <option value="">No section</option>
              {((sections ?? []) as { id: number; name: string }[]).map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="f-order">Sort order</Label>
            <Input
              id="f-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="f-private"
              type="checkbox"
              checked={form.is_private}
              onChange={(e) => set("is_private", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="f-private">Private forum (members only)</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={() => create.mutate()} disabled={!form.name.trim() || create.isPending}>
              {create.isPending ? "Creating…" : "Create Forum"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
