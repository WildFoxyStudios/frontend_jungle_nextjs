"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { Sparkles } from "lucide-react";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "all", label: "All Time" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

export default function MostLikedPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [period, setPeriod] = useState<Period>("week");
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  const load = async (reset = false, p = period) => {
    if (!reset && (loadingMore || !hasMore)) return;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await postsApi.getMostLiked(reset ? undefined : cursor, p);
      if (reset) setPosts(res.data); else setPosts((prev) => [...prev, ...res.data]);
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch { /* ignore */ }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { load(true, period); }, [period]);

  useEffect(() => {
    if (isIntersecting && hasMore && !loadingMore) load(false);
  }, [isIntersecting, hasMore, loadingMore]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Most Liked
        </h1>
      </div>

      {/* Period filter */}
      <div className="flex gap-1 border-b">
        {PERIODS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              period === opt.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : (
        <>
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No posts found for this period.</p>
          )}
          {loadingMore && <Skeleton className="h-48 w-full rounded-lg" />}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}
    </div>
  );
}
