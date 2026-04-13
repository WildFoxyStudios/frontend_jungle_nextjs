"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Card, CardContent } from "@jungle/ui";
import { toast } from "sonner";

export default function BackupsPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: () => adminApi.getBackups(),
  });

  return (
    <AdminPageShell
      title="Backups"
      actions={
        <Button onClick={async () => {
          try { await adminApi.triggerBackup(); toast.success("Backup started"); refetch(); }
          catch { toast.error("Failed"); }
        }}>
          Create Backup
        </Button>
      }
    >
      <div className="space-y-2">
        {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
          (data as { id: string; name: string; size: string; created_at: string }[] ?? []).map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.size} · {new Date(b.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/v1/admin/backups/${b.id}/download`} download>Download</a>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
