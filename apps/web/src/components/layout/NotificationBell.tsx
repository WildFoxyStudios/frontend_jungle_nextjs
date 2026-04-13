"use client";

import Link from "next/link";
import { useRealtimeStore } from "@jungle/hooks";
import { Button, Badge } from "@jungle/ui";
import { Bell } from "lucide-react";

export function NotificationBell() {
  const { unreadNotifications } = useRealtimeStore();

  return (
    <Button variant="ghost" size="icon" asChild className="relative">
      <Link href="/notifications" aria-label={unreadNotifications > 0 ? `Notifications (${unreadNotifications} unread)` : "Notifications"}>
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadNotifications > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 text-xs px-1 py-0 min-w-[1.2rem] h-5 flex items-center justify-center"
          >
            {unreadNotifications > 99 ? "99+" : unreadNotifications}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
