"use client";

import { useCallback, useEffect, useState } from "react";
import { useFeed, useIntersection, useRealtimeStore } from "@jungle/hooks";
import type { Post } from "@jungle/api-client";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { PostComposer } from "@/components/feed/PostComposer";
import { StoryRing } from "@/components/stories/StoryRing";
import { NewPostsBanner } from "@/components/feed/NewPostsBanner";

export default function FeedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useFeed();
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
  const { on } = useRealtimeStore();
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const unsubscribe = on("post.new", () => setNewPostsAvailable(true));
    return unsubscribe;
  }, [on]);

  const feedPosts = data?.pages.flatMap((p: { data: Post[] }) => p.data) ?? [];

  const seen = new Set<number>();
  const uniquePosts: Post[] = [];
  for (const p of [...localPosts, ...feedPosts]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      uniquePosts.push(p);
    }
  }

  const handleNewPost = useCallback((post: Post) => {
    setLocalPosts((prev) => [post, ...prev]);
  }, []);

  const handleDeletePost = useCallback((postId: number) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleRefresh = () => {
    setNewPostsAvailable(false);
    setLocalPosts([]);
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <StoryRing />

      {newPostsAvailable && <NewPostsBanner onRefresh={handleRefresh} />}

      <PostComposer onSuccess={handleNewPost} />

      {uniquePosts.map((post: Post) => (
        <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
      ))}

      {isFetchingNextPage && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
