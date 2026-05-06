"use client";

import { useCallback, useEffect, useState } from "react";
import { notificationsApi } from "@jungle/api-client";
import type { Notification, PaginatedResponse } from "@jungle/api-client";

/**
 * Notifications list + mutations without React Query so consumers work without
 * `QueryClientProvider` (web app removed TanStack from the tree).
 */
export function useNotifications() {
  const [pages, setPages] = useState<PaginatedResponse<Notification>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [markAllPending, setMarkAllPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const first = await notificationsApi.getNotifications(undefined);
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
      const page = await notificationsApi.getNotifications(cursor);
      setPages((prev) => [...prev, page]);
    } catch (err) {
      console.error("[useNotifications] fetchNextPage failed", err);
    } finally {
      setIsFetchingNextPage(false);
    }
  }, [lastPage, isFetchingNextPage]);

  const markRead = {
    mutate: (id: number) => {
      void (async () => {
        try {
          await notificationsApi.markAsRead(id);
          setPages((prev) =>
            prev.map((p) => ({
              ...p,
              data: p.data.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            })),
          );
        } catch (err) {
          console.error("[useNotifications] markRead failed", err);
        }
      })();
    },
  };

  const markAllRead = {
    isPending: markAllPending,
    mutate: () => {
      void (async () => {
        setMarkAllPending(true);
        try {
          await notificationsApi.markAllAsRead();
          setPages((prev) =>
            prev.map((p) => ({
              ...p,
              data: p.data.map((n) => ({ ...n, is_read: true })),
            })),
          );
        } catch (err) {
          console.error("[useNotifications] markAllRead failed", err);
        } finally {
          setMarkAllPending(false);
        }
      })();
    },
  };

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const first = await notificationsApi.getNotifications(undefined);
      setPages([first]);
    } catch {
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const query = {
    data: pages.length > 0 ? { pages } : undefined,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };

  return { query, markRead, markAllRead, refetch };
}
