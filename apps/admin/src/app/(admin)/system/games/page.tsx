"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@jungle/ui";
import { toast } from "sonner";
import { Plus, Trash2, Edit2 } from "lucide-react";

interface Game {
  id: number;
  name: string;
  game_link?: string;
  url?: string;
  description?: string;
  thumbnail?: string;
  cover?: string;
  is_active: boolean;
  play_count?: number;
}

interface GameForm {
  name: string;
  game_link: string;
  description: string;
  cover: string;
}

const EMPTY: GameForm = { name: "", game_link: "", description: "", cover: "" };

export default function GamesAdminPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Game | null>(null);
  const [form, setForm] = useState<GameForm>(EMPTY);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "games"],
    queryFn: () => adminApi.getAdminGames(),
  });

  const games = ((data ?? []) as { data?: Game[] } & Game[])?.data ?? (data as Game[]) ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "games"] });

  const saveMutation = useMutation({
    mutationFn: () =>
      editing
        ? adminApi.updateAdminGame(editing.id, form as unknown as Record<string, unknown>)
        : adminApi.createAdminGame(form as unknown as Record<string, unknown>),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      toast.success(editing ? "Game updated" : "Game added");
    },
  });

  const bulkDelete = useMutation({
    mutationFn: () => adminApi.bulkDeleteAdminGames(Array.from(selected)),
    onSuccess: (res) => {
      invalidate();
      setSelected(new Set());
      toast.success(`Deleted ${res.data.deleted} game${res.data.deleted === 1 ? "" : "s"}`);
    },
  });

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  };

  const startEdit = (g: Game) => {
    setEditing(g);
    setForm({
      name: g.name,
      game_link: g.game_link ?? g.url ?? "",
      description: g.description ?? "",
      cover: g.cover ?? g.thumbnail ?? "",
    });
    setOpen(true);
  };

  const toggleSelected = (id: number) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected = games.length > 0 && selected.size === games.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(games.map((g: Game) => g.id)));
  };

  return (
    <AdminPageShell
      title="Games Management"
      actions={
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkDelete.isPending}
              onClick={() => bulkDelete.mutate()}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete {selected.size}
            </Button>
          )}
          <Button size="sm" onClick={startCreate}>
            <Plus className="h-4 w-4 mr-1" /> Add Game
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="border bg-card divide-y-2 divide-foreground shadow-sm">
          {games.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm font-bold uppercase tracking-wide">No games yet.</p>
          )}
          {games.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-secondary/40 text-sm">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Select all"
              />
              <span className="text-muted-foreground">
                {selected.size === 0
                  ? `${games.length} games`
                  : `${selected.size} selected`}
              </span>
            </div>
          )}
          {games.map((g: Game) => (
            <div key={g.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggleSelected(g.id)}
                  aria-label={`Select ${g.name}`}
                />
                <span className="text-sm font-medium truncate">{g.name}</span>
                <Badge variant={g.is_active ? "default" : "secondary"}>
                  {g.is_active ? "Active" : "Inactive"}
                </Badge>
                {typeof g.play_count === "number" && (
                  <span className="text-xs text-muted-foreground">{g.play_count} plays</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => startEdit(g)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await adminApi.toggleAdminGame(g.id);
                    invalidate();
                  }}
                >
                  {g.is_active ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    await adminApi.deleteAdminGame(g.id);
                    invalidate();
                    toast.success("Deleted");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Game" : "Add Game"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Game URL</Label>
              <Input
                placeholder="https://game.example.com"
                value={form.game_link}
                onChange={(e) => setForm((f) => ({ ...f, game_link: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Cover image URL</Label>
              <Input
                placeholder="https://..."
                value={form.cover}
                onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!form.name || !form.game_link || saveMutation.isPending}
            >
              {editing ? "Save" : "Add Game"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
