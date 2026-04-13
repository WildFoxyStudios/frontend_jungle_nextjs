"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Badge, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface OAuthApp { id: number; name: string; client_id: string; active: boolean; user: { username: string }; created_at: string }

export default function OAuthAppsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "oauth-apps"], queryFn: () => adminApi.getOAuthApps() });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleOAuthApp(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "oauth-apps"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteOAuthApp(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "oauth-apps"] }); toast.success("Deleted"); },
  });

  const apps = (data ?? []) as OAuthApp[];

  return (
    <AdminPageShell title="OAuth Applications">
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-2">
          {apps.length === 0 && <p className="text-muted-foreground text-sm">No OAuth apps registered.</p>}
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{app.name}</p>
                    <Badge variant={app.active ? "default" : "secondary"}>{app.active ? "Active" : "Disabled"}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{app.client_id}</p>
                  <p className="text-xs text-muted-foreground">By @{app.user?.username} · {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => toggleMutation.mutate(app.id)}>
                    {app.active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(app.id)}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
