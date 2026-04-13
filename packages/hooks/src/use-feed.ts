"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "@jungle/api-client";
import type { Post, PaginatedResponse } from "@jungle/api-client";

export interface FeedFilter {
  type?: "all" | "following" | "trending";
  group_id?: number;
  page_id?: number;
  username?: string;
}

export function useFeed(filter?: FeedFilter) {
  return useInfiniteQuery({
    queryKey: ["feed", filter],
    queryFn: ({ pageParam }) =>
      postsApi.getFeed(pageParam as string | undefined, filter?.type),
    getNextPageParam: (lastPage: PaginatedResponse<Post>) =>
      lastPage.meta.has_more ? lastPage.meta.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useExploreFeed() {
  return useInfiniteQuery({
    queryKey: ["feed", "explore"],
    queryFn: ({ pageParam }) => postsApi.getExploreFeed(pageParam as string | undefined),
    getNextPageParam: (lastPage: PaginatedResponse<Post>) =>
      lastPage.meta.has_more ? lastPage.meta.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });
}
