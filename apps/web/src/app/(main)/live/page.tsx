"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { liveApi } from "@jungle/api-client";
import type { LiveStream } from "@jungle/api-client";
import { Button, Card, CardContent, Input, Skeleton, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Label } from "@jungle/ui";
import { Radio, Users, Play } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "@/lib/date";

export default function LiveListPage() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStart, setShowStart] = useState(false);
  const [title, setTitle] = useState("");
  const [starting, setStarting] = useState(false);
  const [myStream, setMyStream] = useState<LiveStream | null>(null);

  useEffect(() => {
    liveApi.getActiveLives()
      .then((r) => setStreams(r.data as LiveStream[]))
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (!title.trim()) { toast.error("Enter a title"); return; }
    setStarting(true);
    try {
      const stream = await liveApi.startLive(title);
      setMyStream(stream);
      toast.success("Live stream started!");
      setShowStart(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start stream");
    } finally {
      setStarting(false);
    }
  };

  const handleStop = async () => {
    try {
      await liveApi.stopLive();
      setMyStream(null);
      toast.success("Stream ended");
    } catch {
      toast.error("Failed to stop stream");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Radio className="h-6 w-6 text-red-500" /> Live
        </h1>
        {myStream ? (
          <Button variant="destructive" onClick={handleStop} className="gap-2">
            <Radio className="h-4 w-4" /> Stop Streaming
          </Button>
        ) : (
          <Button onClick={() => setShowStart(true)} className="gap-2">
            <Radio className="h-4 w-4" /> Go Live
          </Button>
        )}
      </div>

      {/* My active stream */}
      {myStream && (
        <Card className="border-red-500 border-2">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1"><Radio className="h-3 w-3" /> LIVE</Badge>
              <span className="font-semibold">{myStream.title}</span>
            </div>
            <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
              <p className="text-muted-foreground">Stream key for OBS / streaming software:</p>
              <code className="block bg-background border rounded px-3 py-2 font-mono text-xs break-all select-all">
                {myStream.stream_key}
              </code>
              <p className="text-xs text-muted-foreground">
                RTMP URL: <code className="bg-background border rounded px-1 py-0.5 font-mono">/api/v1/live/ingest</code>
              </p>
            </div>
            <Link href={`/live/${myStream.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="h-4 w-4" /> View my stream
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Active streams */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      ) : streams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Radio className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No live streams right now.</p>
            <p className="text-sm text-muted-foreground">Be the first to go live!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {streams.map((s) => (
            <Link key={s.id} href={`/live/${s.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <Play className="h-12 w-12 text-white/40 group-hover:text-white/70 transition-colors" />
                  <Badge variant="destructive" className="absolute top-2 left-2 gap-1">
                    <Radio className="h-3 w-3" /> LIVE
                  </Badge>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded px-2 py-0.5">
                    <Users className="h-3 w-3 text-white" />
                    <span className="text-xs text-white">{s.viewer_count}</span>
                  </div>
                </div>
                <CardContent className="p-3 space-y-1">
                  <p className="font-semibold text-sm line-clamp-1">{s.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {s.publisher && (
                      <span>{s.publisher.first_name} {s.publisher.last_name}</span>
                    )}
                    <span>·</span>
                    <span>{formatDistanceToNow(s.created_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Go Live Dialog */}
      <Dialog open={showStart} onOpenChange={setShowStart}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-red-500" /> Start Live Stream
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Stream Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you streaming about?"
                maxLength={100}
                onKeyDown={(e) => { if (e.key === "Enter") void handleStart(); }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              After starting, you&apos;ll receive a stream key to use with OBS or any RTMP streaming software.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStart(false)}>Cancel</Button>
            <Button onClick={handleStart} disabled={starting || !title.trim()} className="gap-2">
              <Radio className="h-4 w-4" />
              {starting ? "Starting…" : "Go Live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
