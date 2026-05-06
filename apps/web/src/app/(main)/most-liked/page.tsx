"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";
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

 const load = useCallback(async (reset = false, p = period) => {
 if (!reset && (loadingMore || !hasMore)) return;
 if (reset) setLoading(true); else setLoadingMore(true);
 try {
 const res = await postsApi.getMostLiked(reset ? undefined : cursor, p);
 if (reset) setPosts(res.data); else setPosts((prev) => [...prev, ...res.data]);
 setCursor(res.meta.has_more ? res.meta.cursor : undefined);
 setHasMore(res.meta.has_more);
 } catch { /* ignore */ }
 finally { setLoading(false); setLoadingMore(false); }
 }, [cursor, hasMore, loadingMore, period]);

 useEffect(() => { void load(true, period); }, [load, period]);

 useEffect(() => {
 if (isIntersecting && hasMore && !loadingMore) {
 void load(false);
 }
 }, [isIntersecting, hasMore, loadingMore, load]);

 const lcpPostId = useMemo(() => firstHeroImagePostId(posts), [posts]);

 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between gap-3">
 <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-[28px]">
 <Sparkles className="h-6 w-6 text-primary" /> Most Liked
 </h1>
 </div>

 <div className="flex gap-2 overflow-x-auto pb-1">
 {PERIODS.map((opt) => {
 const active = period === opt.value;
 return (
 <button
 key={opt.value}
 onClick={() => setPeriod(opt.value)}
 className={`shrink-0 border px-3 py-1.5 text-xs font-semibold transition-all ${
 active
 ? "bg-primary text-primary-foreground"
 : "bg-card text-foreground hover:bg-muted/50"
 }`}
 >
 {opt.label}
 </button>
 );
 })}
 </div>

 {loading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-48 w-full" />
 ))}
 </div>
 ) : (
 <>
 {posts.map((post) => (
 <PostCard key={post.id} post={post} priority={lcpPostId !== null && post.id === lcpPostId} />
 ))}
 {posts.length === 0 && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">
 No posts found for this period.
 </p>
 </div>
 )}
 {loadingMore && <Skeleton className="h-48 w-full" />}
 <div ref={sentinelRef} className="h-1" />
 </>
 )}
 </div>
 );
}
