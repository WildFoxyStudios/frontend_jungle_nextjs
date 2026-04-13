"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const unsubscribe = on("post.new", () => setNewPostsAvailable(true));
    return unsubscribe;
  }, [on]);

  const posts = data?.pages.flatMap((p: { data: import("@jungle/api-client").Post[] }) => p.data) ?? [];

  const handleRefresh = () => {
    setNewPostsAvailable(false);
    refetch();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <StoryRing />

      {newPostsAvailable && <NewPostsBanner onRefresh={handleRefresh} />}

      <PostComposer />

      {posts.map((post: Post) => (
        <PostCard key={post.id} post={post} />
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
