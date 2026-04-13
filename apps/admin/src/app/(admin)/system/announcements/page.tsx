"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent, Input, Badge } from "@jungle/ui";
import { toast } from "sonner";

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: () => adminApi.getAnnouncements(),
  });

  const handleCreate = async () => {
    if (!title.trim()) return;
    try {
      await adminApi.createAnnouncement({ title, content, is_active: true });
      toast.success("Announcement created");
      setTitle(""); setContent("");
      refetch();
    } catch { toast.error("Failed"); }
  };

  return (
    <AdminPageShell title="Announcements">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="font-semibold">New Announcement</h2>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} />
          <Button onClick={handleCreate}>Create</Button>
        </CardContent>
      </Card>
      <div className="space-y-2 mt-4">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          (data as { id: number; title: string; is_active: boolean; created_at: string }[] ?? []).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_active ? "default" : "secondary"}>
                    {item.is_active ? "Active" : "Inactive"}
                  </Badge>
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
