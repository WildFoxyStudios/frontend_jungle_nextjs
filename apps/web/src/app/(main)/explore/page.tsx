"use client";

import { useEffect } from "react";
import type { Post } from "@jungle/api-client";
import { useExploreFeed, useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Compass } from "lucide-react";

export default function ExplorePage() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useExploreFeed();
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p: { data: Post[] }) => p.data) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Explore</h1>
      {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      {posts.map((post: Post) => <PostCard key={post.id} post={post} />)}
      {isFetchingNextPage && <Skeleton className="h-48 w-full rounded-lg" />}
      {!isLoading && posts.length === 0 && (
        <EmptyState icon={Compass} title="Nothing to explore yet" description="Check back later for trending posts." />
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
