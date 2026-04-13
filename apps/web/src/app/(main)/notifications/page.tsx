"use client";

import { useEffect } from "react";
import { useNotifications, useIntersection } from "@jungle/hooks";
import { Button, Skeleton } from "@jungle/ui";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";

export default function NotificationsPage() {
  const { query, markAllRead } = useNotifications();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
  const t = useTranslations("notifications");

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>{t("markAllRead")}</Button>
      </div>
      <div className="divide-y">
        {notifications.map((n) => <NotificationItem key={n.id} notification={n} />)}
      </div>
      {!query.isLoading && notifications.length === 0 && (
        <EmptyState icon={Bell} title={t("noNotifications")} description={t("noNotifications")} />
      )}
      {isFetchingNextPage && <Skeleton className="h-16 w-full" />}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
