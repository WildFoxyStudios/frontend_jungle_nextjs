"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { liveApi } from "@jungle/api-client";
import type { LiveStream } from "@jungle/api-client";
import { useRealtimeStore } from "@jungle/hooks";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Button } from "@jungle/ui";
import { Radio, Users, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { HlsPlayer } from "@/components/shared/HlsPlayer";

const LIVE_REACTIONS = [
  { emoji: "❤️", key: "love" }, { emoji: "🔥", key: "fire" }, { emoji: "👍", key: "like" },
  { emoji: "😂", key: "haha" }, { emoji: "😢", key: "sad" }, { emoji: "😡", key: "angry" },
];

interface Props { params: Promise<{ id: string }> }

export default function LivePage({ params }: Props) {
  const { id } = use(params);
  const liveId = Number(id);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<LiveStream | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: number; user: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);
  const { on } = useRealtimeStore();

  useEffect(() => {
    liveApi.getLiveStream(liveId)
      .then(setStream)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load live stream"));
  }, [liveId]);

  const streamUrl = `/api/v1/live/${id}/stream.m3u8`;

  // Listen for live chat messages via WebSocket
  useEffect(() => {
    const off = on("message.new" as never, (data) => {
      const d = data as { live_id?: number; user?: string; content?: string; id?: number };
      if (d.live_id !== liveId) return;
      setChatMessages((prev) => [
        ...prev.slice(-99),
        { id: d.id ?? Date.now(), user: d.user ?? "Viewer", text: d.content ?? "", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ]);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return off;
  }, [on, liveId]);

  const sendChat = async () => {
    if (!chatInput.trim() || sending) return;
    const text = chatInput;
    setChatInput("");
    setSending(true);
    // Optimistic add
    const optimistic = { id: Date.now(), user: "You", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages((prev) => [...prev.slice(-99), optimistic]);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    try {
      await liveApi.commentOnLive(liveId, text);
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const sendReaction = async (reaction: string, emoji: string) => {
    // Floating emoji animation
    const reactId = Date.now();
    setFloatingReactions((prev) => [...prev, { id: reactId, emoji }]);
    setTimeout(() => setFloatingReactions((prev) => prev.filter((r) => r.id !== reactId)), 2000);
    try { await liveApi.reactToLive(liveId, reaction); } catch { /* silent */ }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/live"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="destructive" className="gap-1 shrink-0">
            <Radio className="h-3 w-3" /> LIVE
          </Badge>
          <span className="font-semibold truncate">{stream?.title ?? `Stream #${id}`}</span>
        </div>
        {stream?.viewer_count !== undefined && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
            <Users className="h-4 w-4" /> {stream.viewer_count}
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Video */}
        <div className="flex-1 space-y-3">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
            <HlsPlayer
              src={streamUrl}
              isLive
              autoPlay
              controls
              className="w-full h-full"
            />

            {/* Floating reactions */}
            <div className="absolute bottom-4 left-4 pointer-events-none space-y-1 z-10">
              {floatingReactions.map((r) => (
                <div key={r.id} className="text-2xl animate-bounce">{r.emoji}</div>
              ))}
            </div>
          </div>

          {/* Reaction bar */}
          <div className="flex gap-2 justify-center">
            {LIVE_REACTIONS.map(({ emoji, key }) => (
              <button
                key={key}
                onClick={() => void sendReaction(key, emoji)}
                className="text-2xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <Card className="lg:w-72 flex flex-col h-[calc(100vh-14rem)] min-h-64">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Say something!</p>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className="text-xs">
                <span className="font-semibold text-primary">{m.user}: </span>
                <span>{m.text}</span>
                <span className="text-muted-foreground ml-1">{m.time}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </CardContent>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void sendChat(); }}
              placeholder="Say something…"
              className="text-xs h-8"
              disabled={sending}
            />
            <Button size="sm" className="h-8 w-8 p-0 shrink-0" onClick={sendChat} disabled={sending || !chatInput.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
