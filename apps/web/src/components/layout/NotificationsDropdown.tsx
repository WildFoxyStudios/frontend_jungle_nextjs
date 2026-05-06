"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotifications, useRealtimeEvent, useRealtimeStore } from "@jungle/hooks";
import type { Notification } from "@jungle/api-client";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Badge,
 Button,
 Popover,
 PopoverContent,
 PopoverTrigger,
 ScrollArea,
} from "@jungle/ui";
import {
 AtSign,
 Bell,
 BookOpen,
 Briefcase,
 Cake,
 CalendarDays,
 Check,
 DollarSign,
 Heart,
 Loader2,
 Megaphone,
 MessageCircle,
 Package,
 Radio,
 Reply,
 Repeat2,
 ShoppingCart,
 Smile,
 UserPlus,
 Users,
 type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { getNotificationLink } from "@/lib/notification-link";

const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
 following: UserPlus,
 follow_accepted: UserPlus,
 liked_post: Heart,
 reaction: Smile,
 comment: MessageCircle,
 comment_reply: Reply,
 post_mention: AtSign,
 comment_mention: AtSign,
 shared_post: Repeat2,
 joined_group: Users,
 group_join_request: Users,
 group_post_approval: Users,
 group_invite: Users,
 liked_page: Heart,
 page_mention: AtSign,
 event_invite: CalendarDays,
 event_reminder: CalendarDays,
 message_reaction: Smile,
 new_message: MessageCircle,
 birthday: Cake,
 memory: CalendarDays,
 story_reply: BookOpen,
 new_order: ShoppingCart,
 order_status: Package,
 job_application: Briefcase,
 funding_donation: DollarSign,
 funding_goal_reached: DollarSign,
 live_stream: Radio,
 admin_notice: Megaphone,
};

/**
 * Header notifications preview.
 *
 * Mirrors the PHP dropdown from `header/notifecation.phtml`:
 * - Shows up to 10 most recent notifications.
 * - Each row links to the relevant entity.
 * - Unread rows are highlighted; opening the dropdown doesn't auto-mark; the
 * user controls it via the "Mark all as read" action.
 */
export function NotificationsDropdown() {
 const router = useRouter();
 const { unreadNotifications } = useRealtimeStore();
 const { query, markRead, markAllRead, refetch } = useNotifications();
 const [open, setOpen] = useState(false);
 const openRef = useRef(false);
 const t = useTranslations("notifications");
 const tc = useTranslations("common");

 const notifications: Notification[] = (query.data?.pages?.[0]?.data ?? []).slice(0, 10);

 useEffect(() => {
 openRef.current = open;
 }, [open]);

 const refreshIfOpen = useCallback(() => {
 if (openRef.current) void refetch();
 }, [refetch]);

 useRealtimeEvent("notification.new", refreshIfOpen);
 useRealtimeEvent("notification.counter", refreshIfOpen);

 const handleRowClick = (notification: Notification) => {
 if (!notification.is_read) markRead.mutate(notification.id);
 setOpen(false);
 router.push(getNotificationLink(notification));
 };

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button
 variant="outline"
 size="icon"
 className="relative h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={
 unreadNotifications > 0
 ? `${t("title")} (${unreadNotifications})`
 : t("title")
 }
 >
 <Bell className="h-5 w-5" aria-hidden="true" />
 {unreadNotifications > 0 && (
 <Badge
 variant="destructive"
 className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[1.25rem] items-center justify-center px-1 py-0 text-[13px] font-semibold"
 >
 {unreadNotifications > 99 ? "99+" : unreadNotifications}
 </Badge>
 )}
 </Button>
 </PopoverTrigger>
 <PopoverContent
 align="end"
 sideOffset={8}
 className="w-[min(calc(100vw-1rem),22rem)] p-0"
 >
 <header className="flex items-center justify-between px-4 py-2.5 border-b">
 <p className="text-sm font-semibold">{t("title")}</p>
 {unreadNotifications > 0 && (
 <button
 type="button"
 onClick={() => markAllRead.mutate()}
 className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-60"
 disabled={markAllRead.isPending}
 >
 <Check className="h-3.5 w-3.5" />
 {t("markAllRead")}
 </button>
 )}
 </header>
 <ScrollArea className="max-h-[420px]">
 {query.isLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
 </div>
 ) : notifications.length === 0 ? (
 <div className="py-8 text-center text-xs text-muted-foreground">
 {t("noNotifications")}
 </div>
 ) : (
 <ul className="divide-y divide-border">
 {notifications.map((n) => {
 const Icon = NOTIFICATION_ICONS[n.type] ?? Bell;
 return (
 <li key={n.id}>
 <button
 type="button"
 onClick={() => handleRowClick(n)}
 className={`flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/60 ${
 !n.is_read ? "bg-primary/5" : ""
 }`}
 >
 <div className="relative shrink-0">
 <Avatar className="h-9 w-9">
 <AvatarImage src={resolveAvatarUrl(n.actor?.avatar)} />
 <AvatarFallback>
 {n.actor?.first_name?.[0] ?? "?"}
 </AvatarFallback>
 </Avatar>
 <span className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5">
 <Icon className="h-3 w-3 text-primary" />
 </span>
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-xs leading-snug line-clamp-2">
 {n.message}
 </p>
 <p className="mt-0.5 text-[10px] text-muted-foreground">
 {formatDistanceToNow(n.created_at)}
 </p>
 </div>
 {!n.is_read && (
 <span
 className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
 aria-hidden="true"
 />
 )}
 </button>
 </li>
 );
 })}
 </ul>
 )}
 </ScrollArea>
 <footer className="border-t p-2">
 <Button
 asChild
 variant="ghost"
 size="sm"
 className="w-full justify-center text-xs"
 onClick={() => setOpen(false)}
 >
 <Link href="/notifications">{tc("viewAll")}</Link>
 </Button>
 </footer>
 </PopoverContent>
 </Popover>
 );
}
