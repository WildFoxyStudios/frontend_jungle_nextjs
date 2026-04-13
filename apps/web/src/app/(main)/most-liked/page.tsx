"use client";

import { useEffect } from "react";
import { useFeed, useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";

export default function MostLikedPage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeed({ type: "trending" });
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Most Liked</h1>
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
      {isFetchingNextPage && <Skeleton className="h-48 w-full rounded-lg" />}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
