"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Label, Badge } from "@jungle/ui";
import { toast } from "sonner";

interface Announcement {
  id: number;
  title: string;
  text: string;
  target: string;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

export default function AnnouncementsPage() {
  const [form, setForm] = useState({
    title: "",
    text: "",
    starts_at: "",
    ends_at: "",
    active: true,
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminApi.getAnnouncements(),
  });

  const handleCreate = async () => {
    if (!form.text.trim()) return;
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        text: form.text,
        active: form.active,
      };
      if (form.starts_at) payload.starts_at = new Date(form.starts_at).toISOString();
      if (form.ends_at) payload.ends_at = new Date(form.ends_at).toISOString();
      await adminApi.createAnnouncement(payload);
      toast.success("Announcement created");
      setForm({ title: "", text: "", starts_at: "", ends_at: "", active: true });
      refetch();
    } catch {
      toast.error("Failed to create announcement");
    }
  };

  const handleToggle = async (item: Announcement) => {
    try {
      await adminApi.updateAnnouncement(item.id, { active: !item.active });
      refetch();
    } catch {
      toast.error("Failed to update");
    }
  };

  const announcements = ((data ?? []) as { data?: Announcement[] } & Announcement[])?.data ??
    (data as Announcement[]) ?? [];

  return (
    <AdminPageShell title="Announcements" description="Site banners with optional scheduling.">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-extrabold uppercase tracking-wide">New announcement</h2>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Input
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Starts at</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ends at</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active immediately
          </label>
          <Button onClick={handleCreate} disabled={!form.text.trim()}>
            Create announcement
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2 mt-4">
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : (
          announcements.map((item: Announcement) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  {item.title && <p className="font-medium truncate">{item.title}</p>}
                  <p className="text-sm text-muted-foreground truncate">{item.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.starts_at ? `From ${new Date(item.starts_at).toLocaleString()}` : "No start"}
                    {item.ends_at ? ` · until ${new Date(item.ends_at).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={item.active ? "default" : "secondary"}>
                    {item.active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => handleToggle(item)}>
                    {item.active ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      await adminApi.deleteAnnouncement(item.id);
                      toast.success("Deleted");
                      refetch();
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
