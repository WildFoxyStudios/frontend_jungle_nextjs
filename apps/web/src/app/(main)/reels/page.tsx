"use client";
import { useEffect, useRef, useState } from "react";
import { mediaApi } from "@jungle/api-client";
import type { Reel } from "@jungle/api-client";
import { useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { Heart, MessageCircle } from "lucide-react";
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
    <div className="max-w-sm mx-auto snap-y snap-mandatory h-screen overflow-y-scroll">
      {loading && [1, 2].map((i) => <Skeleton key={i} className="h-screen w-full snap-start" />)}
      {reels.map((reel) => <ReelCard key={reel.id} reel={reel} />)}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const [liked, setLiked] = useState(!!reel.my_reaction);
  const [likes, setLikes] = useState(reel.like_count);
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
        <div className="flex flex-col items-center gap-1">
          <MessageCircle className="h-7 w-7" />
          <span className="text-xs">{reel.comment_count}</span>
        </div>
      </div>
    </div>
  );
}