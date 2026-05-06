"use client";

import Link from "next/link";
import type { Notification } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import {
 UserPlus, Heart, Smile, MessageCircle, Reply, AtSign, Repeat2,
 Users, Cake, CalendarDays, BookOpen, ShoppingCart, Package,
 Briefcase, DollarSign, Radio, Megaphone, Bell,
 type LucideIcon,
} from "lucide-react";

const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
 following: UserPlus,
 liked_post: Heart,
 reaction: Smile,
 comment: MessageCircle,
 comment_reply: Reply,
 post_mention: AtSign,
 comment_mention: AtSign,
 shared_post: Repeat2,
 joined_group: Users,
 group_join_request: Users,
 birthday: Cake,
 memory: CalendarDays,
 story_reply: BookOpen,
 new_order: ShoppingCart,
 order_status: Package,
 job_application: Briefcase,
 funding_donation: DollarSign,
 live_stream: Radio,
 admin_notice: Megaphone,
 new_message: MessageCircle,
};

interface NotificationItemProps {
 notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
 const IconComponent = NOTIFICATION_ICONS[notification.type] ?? Bell;
 const actor = notification.actor;

 return (
 <div
 className={`flex items-start gap-3 px-3 py-2.5 -mx-3 hover:bg-muted/40 transition-colors ${
 !notification.is_read ? "bg-primary/[0.07]" : ""
 }`}
 >
 {actor ? (
 <Link href={`/profile/${actor.username}`} className="shrink-0">
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(actor.avatar)} />
 <AvatarFallback>{actor.first_name?.[0] ?? actor.username[0]}</AvatarFallback>
 </Avatar>
 </Link>
 ) : (
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
 <IconComponent className="h-5 w-5 text-muted-foreground" />
 </div>
 )}
 <div className="min-w-0 flex-1">
 <p className="text-[15px] leading-snug">{notification.message}</p>
 <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
 {formatDistanceToNow(notification.created_at)}
 <IconComponent className="h-3 w-3 shrink-0" />
 </p>
 </div>
 {!notification.is_read && (
 <span className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />
 )}
 </div>
 );
}
