"use client";

import { useEffect, useState, useCallback } from "react";
import { messagesApi } from "@jungle/api-client";
import type { Conversation } from "@jungle/api-client";
import {
  Button, Card, CardContent, Input, Skeleton,
  Avatar, AvatarFallback, AvatarImage, Badge,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@jungle/ui";
import { InviteFriendsDialog } from "@/components/shared/InviteFriendsDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Megaphone, Plus, Send, Trash2, Users } from "lucide-react";

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBroadcast, setSelectedBroadcast] = useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    messagesApi.getBroadcasts()
      .then((r) => setBroadcasts(Array.isArray(r?.data) ? r.data : []))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateBroadcast = async (memberIds: number[]) => {
    try {
      const broadcast = await messagesApi.createBroadcast({ name: "Broadcast List", member_ids: memberIds });
      setBroadcasts((prev) => [broadcast, ...prev]);
      toast.success("Broadcast list created");
    } catch {
      toast.error("Failed to create broadcast");
    }
  };

  const handleDeleteBroadcast = async (id: number) => {
    try {
      await messagesApi.deleteBroadcast(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      if (selectedBroadcast?.id === id) setSelectedBroadcast(null);
      toast.success("Broadcast deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleSendBroadcast = useCallback(async () => {
    if (!selectedBroadcast || !message.trim()) return;
    setSending(true);
    try {
      await messagesApi.sendBroadcast(selectedBroadcast.id, message);
      setMessage("");
      toast.success("Message sent to all members!");
    } catch {
      toast.error("Failed to send broadcast");
    } finally {
      setSending(false);
    }
  }, [selectedBroadcast, message]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" /> Broadcasts
        </h1>
        <InviteFriendsDialog title="New Broadcast List" onInvite={handleCreateBroadcast}>
          <Button size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Broadcast
          </Button>
        </InviteFriendsDialog>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : broadcasts.length === 0 ? (
        <EmptyState icon={Megaphone} title="No broadcasts" description="Create a broadcast list to send messages to multiple people at once." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Broadcast list */}
          <div className="space-y-2">
            {broadcasts.map((b) => (
              <Card
                key={b.id}
                className={`cursor-pointer transition-colors ${selectedBroadcast?.id === b.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedBroadcast(b)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="bg-primary/10 text-primary rounded-full p-2 shrink-0">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{b.name ?? "Broadcast List"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" /> {b.members.length} members
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleDeleteBroadcast(b.id); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Send message panel */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {selectedBroadcast ? (
                <>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedBroadcast.name ?? "Broadcast List"}</h3>
                    <p className="text-xs text-muted-foreground">{selectedBroadcast.members.length} recipients</p>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {selectedBroadcast.members.slice(0, 8).map((m) => (
                      <Avatar key={m.user.id} className="h-7 w-7" title={`${m.user.first_name} ${m.user.last_name}`}>
                        <AvatarImage src={m.user.avatar} />
                        <AvatarFallback className="text-xs">{m.user.first_name[0]}</AvatarFallback>
                      </Avatar>
                    ))}
                    {selectedBroadcast.members.length > 8 && (
                      <Badge variant="secondary" className="text-xs">+{selectedBroadcast.members.length - 8}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a broadcast message…"
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendBroadcast()}
                      disabled={sending}
                    />
                    <Button onClick={handleSendBroadcast} disabled={sending || !message.trim()} className="gap-1.5 shrink-0">
                      <Send className="h-3.5 w-3.5" /> Send
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Select a broadcast list to send a message.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
