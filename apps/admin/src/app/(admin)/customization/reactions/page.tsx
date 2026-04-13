"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface ReactionType { id: number; name: string; icon: string; is_default: boolean }

export default function ReactionsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "reaction-types"], queryFn: () => adminApi.getReactionTypes() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createReactionType({ name: form.name, icon: form.icon }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "reaction-types"] }); setOpen(false); setForm({ name: "", icon: "" }); toast.success("Reaction type created"); },
    onError: () => toast.error("Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteReactionType(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "reaction-types"] }); toast.success("Deleted"); },
  });

  const reactions = (data ?? []) as ReactionType[];

  return (
    <AdminPageShell title="Reaction Types" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Reaction</Button>
    }>
      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {reactions.map((r) => (
            <Card key={r.id} className="group relative">
              <CardContent className="p-3 text-center">
                <div className="text-3xl mb-1">{r.icon}</div>
                <p className="text-xs font-medium capitalize">{r.name}</p>
                {!r.is_default && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate(r.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {reactions.length === 0 && <p className="col-span-full text-muted-foreground text-sm">No reaction types yet.</p>}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Reaction Type</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. love" />
            </div>
            <div className="space-y-1">
              <Label>Icon (emoji or URL)</Label>
              <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="❤️ or https://..." />
              {form.icon && <div className="text-3xl mt-1">{form.icon}</div>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.icon || createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
