"use client";

import { useState, useEffect } from "react";
import { usersApi } from "@jungle/api-client";
import type { PublicUser } from "@jungle/api-client";
import {
  Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
  Avatar, AvatarImage, AvatarFallback, Input, ScrollArea, Checkbox,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteFriendsDialogProps {
  onInvite: (userIds: number[]) => Promise<void>;
  children: React.ReactNode;
  title?: string;
}

export function InviteFriendsDialog({ onInvite, children, title = "Invite Friends" }: InviteFriendsDialogProps) {
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<PublicUser[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    usersApi.getSuggestions()
      .then((r) => setFriends(Array.isArray(r) ? r : []))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = search
    ? friends.filter((f) =>
        `${f.first_name} ${f.last_name} ${f.username}`.toLowerCase().includes(search.toLowerCase())
      )
    : friends;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    try {
      await onInvite(Array.from(selected));
      toast.success(`Invited ${selected.size} friends`);
      setOpen(false);
      setSelected(new Set());
    } catch {
      toast.error("Failed to send invites");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends…"
            className="pl-8 h-8 text-sm"
          />
        </div>

        <ScrollArea className="h-64">
          {loading ? (
            <p className="text-sm text-center py-4 text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center py-4 text-muted-foreground">No friends found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 text-left ${selected.has(f.id) ? "bg-primary/5" : ""}`}
                >
                  <Checkbox checked={selected.has(f.id)} className="pointer-events-none" />
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={resolveAvatarUrl(f.avatar)} />
                    <AvatarFallback>{f.first_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.first_name} {f.last_name}</p>
                    <p className="text-xs text-muted-foreground">@{f.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || selected.size === 0}>
            {submitting ? "Sending…" : `Invite (${selected.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
