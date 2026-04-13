"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Button, Input, Label, Badge, Card, CardContent, Skeleton, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Game { id: number; name: string; url: string; thumbnail: string; is_active: boolean; play_count: number }

export default function GamesAdminPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", thumbnail: "" });

  const { data, isLoading } = useQuery({ queryKey: ["admin", "games"], queryFn: () => adminApi.getAdminGames() });

  const createMutation = useMutation({
    mutationFn: () => adminApi.createAdminGame(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "games"] }); setOpen(false); setForm({ name: "", url: "", thumbnail: "" }); toast.success("Game added"); },
  });

  const games = (data ?? []) as Game[];

  return (
    <AdminPageShell title="Games Management" actions={
      <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Game</Button>
    }>
      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <div className="border rounded-lg divide-y">
          {games.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No games yet.</p>}
          {games.map((g) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{g.name}</span>
                <Badge variant={g.is_active ? "default" : "secondary"}>{g.is_active ? "Active" : "Inactive"}</Badge>
                <span className="text-xs text-muted-foreground">{g.play_count} plays</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={async () => { await adminApi.toggleAdminGame(g.id); qc.invalidateQueries({ queryKey: ["admin", "games"] }); }}>
                  {g.is_active ? "Disable" : "Enable"}
                </Button>
                <Button variant="destructive" size="sm" onClick={async () => { await adminApi.deleteAdminGame(g.id); qc.invalidateQueries({ queryKey: ["admin", "games"] }); toast.success("Deleted"); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Game</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {(["name", "url", "thumbnail"] as const).map((field) => (
              <div key={field} className="space-y-1">
                <Label className="capitalize">{field}</Label>
                <Input value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} placeholder={field === "url" ? "https://game.example.com" : field === "thumbnail" ? "https://..." : "Game name"} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!form.name || !form.url || createMutation.isPending}>Add Game</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
