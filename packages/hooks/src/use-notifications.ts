"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@jungle/api-client";
import type { Notification, PaginatedResponse } from "@jungle/api-client";

export function useNotifications() {
  const qc = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam }) =>
      notificationsApi.getNotifications(pageParam as string | undefined),
    getNextPageParam: (lastPage: PaginatedResponse<Notification>) =>
      lastPage.meta.has_more ? lastPage.meta.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return { query, markRead, markAllRead };
}
