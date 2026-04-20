"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

interface ForumRow {
  id: number;
  name: string;
  description?: string;
  section_id?: number;
  is_private?: boolean;
  sort_order?: number;
}

export default function EditForumPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const forumId = Number(id);

  const [form, setForm] = useState({
    name: "",
    description: "",
    section_id: "",
    is_private: false,
    sort_order: 0,
  });

  const { data: forums, isLoading } = useQuery({
    queryKey: ["admin", "forums"],
    queryFn: () => adminApi.getAdminForums(),
  });

  const { data: sections } = useQuery({
    queryKey: ["admin", "forum-sections"],
    queryFn: () => adminApi.getForumSections(),
  });

  useEffect(() => {
    const forum = ((forums?.data ?? []) as ForumRow[]).find((f) => f.id === forumId);
    if (forum) {
      setForm({
        name: forum.name ?? "",
        description: forum.description ?? "",
        section_id: forum.section_id ? String(forum.section_id) : "",
        is_private: forum.is_private ?? false,
        sort_order: forum.sort_order ?? 0,
      });
    }
  }, [forums, forumId]);

  const update = useMutation({
    mutationFn: () =>
      adminApi.updateAdminForum(forumId, {
        name: form.name,
        description: form.description || undefined,
        section_id: form.section_id ? Number(form.section_id) : undefined,
        is_private: form.is_private,
        sort_order: form.sort_order,
      }),
    onSuccess: () => {
      toast.success("Forum updated");
      router.push("/content/forums");
    },
    onError: () => toast.error("Failed to update forum"),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  if (isLoading) return <div className="p-6"><Skeleton className="h-64 w-full max-w-lg" /></div>;

  return (
    <AdminPageShell title={`Edit Forum #${forumId}`}>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">Forum details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ef-name">Name *</Label>
            <Input id="ef-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ef-desc">Description</Label>
            <Input id="ef-desc" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ef-section">Section</Label>
            <select
              id="ef-section"
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
            <Label htmlFor="ef-order">Sort order</Label>
            <Input
              id="ef-order"
              type="number"
              value={form.sort_order}
              onChange={(e) => set("sort_order", Number(e.target.value))}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ef-private"
              type="checkbox"
              checked={form.is_private}
              onChange={(e) => set("is_private", e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="ef-private">Private forum</Label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button onClick={() => update.mutate()} disabled={!form.name.trim() || update.isPending}>
              {update.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
