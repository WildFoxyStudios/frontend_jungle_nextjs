"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore, useRealtimeStore } from "@jungle/hooks";
import { Badge } from "@jungle/ui";
import { Home, Compass, MessageCircle, Bell, User, type LucideIcon } from "lucide-react";

const STATIC_LINKS: { href: string; key: string; Icon: LucideIcon; badge?: string }[] = [
  { href: "/feed", key: "feed", Icon: Home },
  { href: "/explore", key: "explore", Icon: Compass },
  { href: "/messages", key: "messages", Icon: MessageCircle, badge: "messages" },
  { href: "/notifications", key: "notifications", Icon: Bell, badge: "notifications" },
];

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { user } = useAuthStore();
  const { unreadMessages, unreadNotifications } = useRealtimeStore();

  const links = [
    ...STATIC_LINKS,
    { href: user ? `/profile/${user.username}` : "/login", key: "profile", Icon: User },
  ];

  const getBadge = (badge?: string) => {
    if (badge === "messages") return unreadMessages;
    if (badge === "notifications") return unreadNotifications;
    return 0;
  };

  return (
    <nav aria-label="Mobile navigation" className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex">
      {links.map(({ href, key, Icon, badge }) => {
        const count = getBadge(badge);
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs relative ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{t(key)}</span>
            {count > 0 && (
              <Badge
                variant="destructive"
                className="absolute top-1 right-1/4 text-xs px-1 py-0 min-w-[1rem] h-4"
              >
                {count > 9 ? "9+" : count}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
