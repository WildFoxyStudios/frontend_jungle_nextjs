"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Copy, Trash2 } from "lucide-react";

interface Invitation { id: number; code: string; email?: string; max_uses: number; used_count: number; created_at: string }

export default function InvitationsPage() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin", "invitations"], queryFn: () => adminApi.getInvitations() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createInvitation({ email: email || undefined, max_uses: 1 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "invitations"] }); setEmail(""); toast.success("Invitation created"); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteInvitation(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "invitations"] }); toast.success("Deleted"); },
  });

  const invitations = (data ?? []) as Invitation[];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <AdminPageShell title="Invitations">
      <div className="flex gap-2 max-w-md">
        <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <Plus className="h-4 w-4 mr-1" /> Create
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-48 w-full mt-4" /> : (
        <div className="space-y-2 mt-4">
          {invitations.length === 0 && <p className="text-muted-foreground text-sm">No invitations yet.</p>}
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {inv.email && <p className="text-sm font-medium">{inv.email}</p>}
                  <p className="text-xs font-mono text-muted-foreground truncate">{siteUrl}/register?invite={inv.code}</p>
                  <p className="text-xs text-muted-foreground mt-1">Used: {inv.used_count}/{inv.max_uses} · {new Date(inv.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge variant={inv.used_count >= inv.max_uses ? "secondary" : "default"}>
                    {inv.used_count >= inv.max_uses ? "Used" : "Active"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(`${siteUrl}/register?invite=${inv.code}`); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(inv.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
