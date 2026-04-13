"use client";

import Link from "next/link";
import type { Notification } from "@jungle/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@jungle/ui";
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
};

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const IconComponent = NOTIFICATION_ICONS[notification.type] ?? Bell;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg ${notification.is_read ? "" : "bg-primary/5"}`}>
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={notification.actor?.avatar} />
          <AvatarFallback>{notification.actor?.first_name?.[0]}</AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
          <IconComponent className="h-3.5 w-3.5 text-primary" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {new Date(notification.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
