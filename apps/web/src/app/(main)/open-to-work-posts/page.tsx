"use client";

import { useEffect, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post } from "@jungle/api-client";
import { PostCard } from "@/components/feed/PostCard";
import { Skeleton } from "@jungle/ui";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { useIntersection } from "@jungle/hooks";

export default function OpenToWorkPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  const load = async (reset = false) => {
    if (!reset && (loadingMore || !hasMore)) return;
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const res = await postsApi.getOpenToWorkPosts(reset ? undefined : cursor);
      if (reset) setPosts(res.data); else setPosts((p) => [...p, ...res.data]);
      setCursor(res.meta.has_more ? res.meta.cursor : undefined);
      setHasMore(res.meta.has_more);
    } catch { /* ignore */ }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { load(true); }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loadingMore) load(false);
  }, [isIntersecting, hasMore, loadingMore]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 p-2 rounded-lg">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Open to Work</h1>
          <p className="text-sm text-muted-foreground">Posts from people looking for opportunities</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open-to-work posts yet"
          description="When people share that they're looking for work, their posts will appear here."
        />
      ) : (
        <>
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
          {loadingMore && <Skeleton className="h-48 w-full rounded-lg" />}
          <div ref={sentinelRef} className="h-1" />
        </>
      )}
    </div>
  );
}
