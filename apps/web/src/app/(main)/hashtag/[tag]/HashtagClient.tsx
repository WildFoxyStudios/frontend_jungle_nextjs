"use client";

import { useEffect } from "react";
import type { Post } from "@jungle/api-client";
import { searchApi } from "@jungle/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersection } from "@jungle/hooks";
import { Skeleton } from "@jungle/ui";
import { PostCard } from "@/components/feed/PostCard";

interface Props { tag: string }

export function HashtagClient({ tag }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["hashtag", tag],
    queryFn: ({ pageParam }) => searchApi.getHashtagPosts(tag, pageParam as string | undefined),
    getNextPageParam: (last) => last.meta.has_more ? last.meta.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const posts = data?.pages.flatMap((p) => p.data as Post[]) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">#{tag}</h1>
      {isLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
      {posts.map((post: Post) => <PostCard key={post.id} post={post} />)}
      {isFetchingNextPage && <Skeleton className="h-48 w-full rounded-lg" />}
      {!isLoading && posts.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No posts for #{tag} yet.</p>
      )}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
