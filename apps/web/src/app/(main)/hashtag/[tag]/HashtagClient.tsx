"use client";

import { useEffect, useState } from "react";
import type { Post } from "@jungle/api-client";
import { searchApi } from "@jungle/api-client";
import { useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { firstHeroImagePostId } from "@/lib/feed-lcp";

interface Props {
 tag: string;
}

export function HashtagClient({ tag }: Props) {
 const [posts, setPosts] = useState<Post[]>([]);
 const [cursor, setCursor] = useState<string | undefined>(undefined);
 const [hasMore, setHasMore] = useState(true);
 const [loading, setLoading] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);

 useEffect(() => {
 setPosts([]);
 setCursor(undefined);
 setHasMore(true);
 let cancelled = false;
 (async () => {
 setLoading(true);
 try {
 const res = await searchApi.getHashtagPosts(tag, undefined);
 if (cancelled) return;
 const rows = (res.data as Post[]) ?? [];
 setPosts(rows);
 const more = !!res.meta?.has_more;
 setHasMore(more);
 setCursor(more ? res.meta.cursor : undefined);
 } catch {
 if (!cancelled) {
 setPosts([]);
 setHasMore(false);
 setCursor(undefined);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [tag]);

 const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

 useEffect(() => {
 if (!isIntersecting || !hasMore || loadingMore || loading || cursor === undefined) return;
 let cancelled = false;
 (async () => {
 setLoadingMore(true);
 try {
 const res = await searchApi.getHashtagPosts(tag, cursor);
 if (cancelled) return;
 const rows = (res.data as Post[]) ?? [];
 setPosts((prev) => [...prev, ...rows]);
 const more = !!res.meta?.has_more;
 setHasMore(more);
 setCursor(more ? res.meta.cursor : undefined);
 } catch {
 if (!cancelled) setHasMore(false);
 } finally {
 if (!cancelled) setLoadingMore(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [isIntersecting, hasMore, loadingMore, loading, cursor, tag]);

 const lcpPostId = firstHeroImagePostId(posts);

 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <h1 className="text-2xl font-bold sm:text-[28px]">#{tag}</h1>
 {loading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
 {posts.map((post: Post) => (
 <PostCard key={post.id} post={post} priority={lcpPostId !== null && post.id === lcpPostId} />
 ))}
 {loadingMore && <Skeleton className="h-48 w-full" />}
 {!loading && posts.length === 0 && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">
 No posts for #{tag} yet.
 </p>
 </div>
 )}
 <div ref={sentinelRef} className="h-1" />
 </div>
 );
}
