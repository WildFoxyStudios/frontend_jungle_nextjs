"use client";

import { Fragment, useCallback, useEffect } from "react";
import { useNotifications, useIntersection, useRealtimeEvent } from "@jungle/hooks";
import { Button, PageContainer, Skeleton } from "@jungle/ui";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { Bell } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { calendarDayKey } from "@/lib/date";

export default function NotificationsPage() {
 const { query, markAllRead, refetch } = useNotifications();
 const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = query;
 const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
 const t = useTranslations("notifications");
 const locale = useLocale();

 useEffect(() => {
 if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
 }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

 const reloadNotifications = useCallback(() => {
 void refetch();
 }, [refetch]);

 useRealtimeEvent("notification.new", reloadNotifications);
 useRealtimeEvent("notification.counter", reloadNotifications);

 useEffect(() => {
 const onVis = () => {
 if (document.visibilityState === "visible") void refetch();
 };
 document.addEventListener("visibilitychange", onVis);
 return () => document.removeEventListener("visibilitychange", onVis);
 }, [refetch]);

 const notifications = data?.pages.flatMap((p) => p.data) ?? [];

 const rowItems = notifications.map((n, i) => {
 const prev = notifications[i - 1];
 const showHeader =
 !prev || calendarDayKey(prev.created_at) !== calendarDayKey(n.created_at);
 const header = new Date(n.created_at).toLocaleDateString(locale, {
 weekday: "long",
 year: "numeric",
 month: "short",
 day: "numeric",
 });
 return (
 <Fragment key={n.id}>
 {showHeader && (
 <p className="sticky top-0 z-[1] bg-background/95 px-1 py-2 text-xs font-semibold text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80">
 {header}
 </p>
 )}
 <NotificationItem notification={n} />
 </Fragment>
 );
 });

 return (
 <PageContainer size="sm" className="space-y-4 py-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
 <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
 {t("markAllRead")}
 </Button>
 </div>

 {query.isLoading ? (
 <div className="space-y-2">
 {[1, 2, 3, 4, 5].map((i) => (
 <Skeleton key={i} className="h-20 w-full rounded-md" />
 ))}
 </div>
 ) : (
 <div className="space-y-2">{rowItems}</div>
 )}

 {!query.isLoading && notifications.length === 0 && (
 <EmptyState icon={Bell} title={t("noNotifications")} />
 )}
 {isFetchingNextPage && <Skeleton className="h-16 w-full" />}
 <div ref={sentinelRef} className="h-1" />
 </PageContainer>
 );
}
