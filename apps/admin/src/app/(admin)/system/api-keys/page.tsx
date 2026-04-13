"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Badge, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";

interface ApiKey { id: number; name: string; key: string; is_active: boolean; created_at: string }

export default function ApiKeysPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin", "api-keys"], queryFn: () => adminApi.getApiKeys() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createApiKey({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }); setName(""); toast.success("API key created"); },
    onError: () => toast.error("Failed to create"),
  });

  const keys = (data ?? []) as ApiKey[];

  return (
    <AdminPageShell title="API Access Keys">
      <div className="flex gap-2 max-w-sm">
        <Input placeholder="Key name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2 mt-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-2 mt-4">
          {keys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{key.name}</p>
                    <Badge variant={key.is_active ? "default" : "secondary"}>{key.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground truncate mt-1">{key.key}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(key.key); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={async () => {
                    await adminApi.toggleApiKey(key.id);
                    qc.invalidateQueries({ queryKey: ["admin", "api-keys"] });
                    toast.success(key.is_active ? "Disabled" : "Enabled");
                  }}>
                    {key.is_active ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={async () => {
                    await adminApi.deleteApiKey(key.id);
                    qc.invalidateQueries({ queryKey: ["admin", "api-keys"] });
                    toast.success("Deleted");
                  }}>Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {keys.length === 0 && <p className="text-muted-foreground text-sm">No API keys yet.</p>}
        </div>
      )}
    </AdminPageShell>
  );
}
