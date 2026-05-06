"use client";

import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { postsApi } from "@jungle/api-client";
import type { Post, PaginatedResponse } from "@jungle/api-client";

/** Post-type filter values accepted by the backend `/v1/feed?filter=`. */
export type FeedPostType =
  | "all"
  | "text"
  | "photos"
  | "videos"
  | "music"
  | "files"
  | "location"
  | "following"
  | "trending";

export interface FeedFilter {
  type?: FeedPostType;
  group_id?: number;
  page_id?: number;
  username?: string;
}

function feedTypeParam(filter?: FeedFilter): string | undefined {
  const t = filter?.type;
  return t && t !== "all" ? t : undefined;
}

/**
 * Home feed with infinite scroll. No React Query — works without
 * `QueryClientProvider` (web app removed TanStack from the tree).
 */
export function useFeed(filter?: FeedFilter) {
  const typeFilter = feedTypeParam(filter);
  const filterKey = useMemo(() => JSON.stringify(filter ?? {}), [filter]);

  // Ref to avoid stale closure capture of typeFilter in fetchNextPage
  const typeFilterRef = useRef(typeFilter);
  typeFilterRef.current = typeFilter;

  const [pages, setPages] = useState<PaginatedResponse<Post>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPages([]);
      try {
        const first = await postsApi.getFeed(undefined, typeFilter);
        if (!cancelled) setPages([first]);
      } catch {
        if (!cancelled) setPages([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterKey, typeFilter]);

  const lastPage = pages[pages.length - 1];
  const hasNextPage = Boolean(lastPage?.meta.has_more);

  const fetchNextPage = useCallback(async () => {
    if (!lastPage?.meta.has_more || isFetchingNextPage) return;
    const cursor = lastPage.meta.cursor;
    setIsFetchingNextPage(true);
    try {
      // Use ref for latest filter to avoid stale closure
      const page = await postsApi.getFeed(cursor, typeFilterRef.current);
      setPages((prev) => [...prev, page]);
    } catch (err) {
      console.error("[useFeed] fetchNextPage failed", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [lastPage, isFetchingNextPage]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const first = await postsApi.getFeed(undefined, typeFilterRef.current);
      setPages([first]);
    } catch {
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    data: pages.length > 0 ? { pages } : undefined,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  };
}

export function useExploreFeed() {
  const [pages, setPages] = useState<PaginatedResponse<Post>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setPages([]);
      try {
        const first = await postsApi.getExploreFeed(undefined);
        if (!cancelled) setPages([first]);
      } catch {
        if (!cancelled) setPages([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const lastPage = pages[pages.length - 1];
  const hasNextPage = Boolean(lastPage?.meta.has_more);

  const fetchNextPage = useCallback(async () => {
    if (!lastPage?.meta.has_more || isFetchingNextPage) return;
    const cursor = lastPage.meta.cursor;
    setIsFetchingNextPage(true);
    try {
      const page = await postsApi.getExploreFeed(cursor);
      setPages((prev) => [...prev, page]);
    } catch (err) {
      console.error("[useFeed] fetchNextPage failed", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [lastPage, isFetchingNextPage]);

  return {
    data: pages.length > 0 ? { pages } : undefined,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
