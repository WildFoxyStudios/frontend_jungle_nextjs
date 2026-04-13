"use client";

import { use, useEffect, useRef, useState } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Input, Button } from "@jungle/ui";
import { Radio } from "lucide-react";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function LivePage({ params }: Props) {
  const { id } = use(params);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ user: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCount] = useState(Math.floor(Math.random() * 500) + 10);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Try native HLS (Safari / iOS) or dynamic import hls.js for others
    const streamUrl = `/api/v1/live/${id}/stream`;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
    } else {
      // Fallback for browsers without native HLS support
      // hls.js (v1.5+) is in package.json and can be installed for full support
      video.src = streamUrl;
      video.play().catch(() => {
        toast.error("Your browser may not support HLS. Try Safari or update your browser.");
      });
    }
  }, [id]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [...m.slice(-49), { user: "You", text: chatInput }]);
    setChatInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Video */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="flex items-center gap-1">
              <Radio className="h-3 w-3" /> LIVE
            </Badge>
            <span className="text-sm text-muted-foreground">{viewerCount} watching</span>
          </div>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full"
              controls
              autoPlay
              playsInline
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-white/60 text-sm">Stream #{id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Chat */}
        <Card className="lg:w-72 flex flex-col h-[calc(100vh-10rem)] min-h-64">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-sm">Live Chat</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((m, i) => (
              <p key={i} className="text-xs">
                <span className="font-semibold text-primary">{m.user}: </span>
                {m.text}
              </p>
            ))}
            {chatMessages.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
            )}
          </CardContent>
          <div className="p-3 border-t flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendChat()}
              placeholder="Say something…"
              className="text-xs h-8"
            />
            <Button size="sm" className="h-8 shrink-0" onClick={sendChat}>Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
