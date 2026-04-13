"use client";

import Link from "next/link";
import { useRealtimeStore } from "@jungle/hooks";
import { Button, Badge } from "@jungle/ui";
import { MessageCircle } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";

export function Header() {
  const { unreadMessages } = useRealtimeStore();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/feed" className="md:hidden text-xl font-bold text-primary">Jungle</Link>
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/messages" aria-label={unreadMessages > 0 ? `Messages (${unreadMessages} unread)` : "Messages"}>
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {unreadMessages > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 text-xs px-1 py-0 min-w-[1.2rem] h-5 flex items-center justify-center"
                >
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </Badge>
              )}
            </Link>
          </Button>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
