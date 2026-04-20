"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { mediaApi } from "@jungle/api-client";
import type { Reel } from "@jungle/api-client";
import { useIntersection } from "@jungle/hooks";
import { Button, Skeleton, Input } from "@jungle/ui";
import { Heart, MessageCircle, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  const load = async () => {
    if (!hasMore) return;
    try {
      const r = await mediaApi.getReels(cursor);
      setReels((prev) => [...prev, ...r.data]);
      setCursor(r.meta.cursor);
      setHasMore(r.meta.has_more);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => { if (isIntersecting) void load(); }, [isIntersecting]);

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-20">
        <Button asChild size="sm" className="gap-1.5 shadow-lg">
          <Link href="/reels/create"><Plus className="h-4 w-4" /> Create Reel</Link>
        </Button>
      </div>
      <div className="max-w-sm mx-auto snap-y snap-mandatory h-screen overflow-y-scroll">
        {loading && [1, 2].map((i) => <Skeleton key={i} className="h-screen w-full snap-start" />)}
        {reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
        <div ref={sentinelRef} className="h-1" />
      </div>
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const [liked, setLiked] = useState(!!reel.my_reaction);
  const [likes, setLikes] = useState(reel.like_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<{ id: number; content: string; user: { username: string } }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleLike = async () => {
    try {
      if (liked) {
        await mediaApi.reactToReel(reel.id, "");
        setLiked(false); setLikes((l) => l - 1);
      } else {
        await mediaApi.reactToReel(reel.id, "like");
        setLiked(true); setLikes((l) => l + 1);
      }
    } catch { toast.error("Failed"); }
  };

  const loadComments = async () => {
    try {
      const r = await mediaApi.getReelComments(reel.id) as { data: { id: number; content: string; user: { username: string } }[] };
      setComments(r.data ?? []);
    } catch { /* silent */ }
  };

  const handleToggleComments = () => {
    if (!showComments) loadComments();
    setShowComments((v) => !v);
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSendingComment(true);
    try {
      await mediaApi.addReelComment(reel.id, newComment);
      setNewComment("");
      await loadComments();
    } catch { toast.error("Failed to send comment"); }
    finally { setSendingComment(false); }
  };

  return (
    <div className="relative h-screen snap-start bg-black overflow-hidden">
      <video ref={videoRef} src={reel.video.url} className="w-full h-full object-cover" loop muted autoPlay playsInline />

      <div className="absolute bottom-4 left-4 right-16 text-white">
        <p className="font-semibold text-sm">@{reel.publisher.username}</p>
        {reel.caption && <p className="text-xs mt-1 line-clamp-2">{reel.caption}</p>}
      </div>

      <div className="absolute right-3 bottom-20 flex flex-col items-center gap-4 text-white">
        <button onClick={handleLike} className="flex flex-col items-center gap-1">
          <Heart className={"h-7 w-7 " + (liked ? "fill-red-500 text-red-500" : "")} />
          <span className="text-xs">{likes}</span>
        </button>
        <button onClick={handleToggleComments} className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7" />
          <span className="text-xs">{reel.comment_count}</span>
        </button>
      </div>

      {showComments && (
        <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur rounded-t-2xl max-h-[50vh] flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white text-sm font-semibold">Comments</span>
            <button onClick={() => setShowComments(false)} className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {comments.length === 0 ? (
              <p className="text-white/50 text-xs text-center py-4">No comments yet</p>
            ) : comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="text-white font-medium">@{c.user.username} </span>
                <span className="text-white/80">{c.content}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 p-3 border-t border-white/10">
            <Input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment…"
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") handleSendComment(); }}
            />
            <Button size="sm" variant="ghost" onClick={handleSendComment} disabled={sendingComment || !newComment.trim()} className="text-white">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}