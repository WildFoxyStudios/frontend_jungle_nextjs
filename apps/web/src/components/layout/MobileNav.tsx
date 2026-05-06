"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuthStore, useRealtimeStore } from "@jungle/hooks";
import { Badge, BottomNavShell } from "@jungle/ui";
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
 <BottomNavShell aria-label={t("mainNavigation")}>
 <ul className="grid grid-cols-5 pl-safe pr-safe">
 {links.map(({ href, key, Icon, badge }) => {
 const count = getBadge(badge);
 const isActive = pathname === href || pathname.startsWith(href + "/");
 return (
 <li key={href}>
 <Link
 href={href}
 aria-current={isActive ? "page" : undefined}
 aria-label={t(key)}
 className={[
 // 44px touch target (iOS guideline) + safe spacing.
 "relative flex min-h-[44px] flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold",
 "transition-[background-color,color] duration-150",
 isActive
 ? "text-primary"
 : "text-foreground active:bg-secondary-soft hover:bg-muted",
 ].join(" ")}
 >
 {isActive && (
 <span className="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" aria-hidden="true" />
 )}
 <Icon className="h-5 w-5" strokeWidth={isActive ? 3 : 2} />
 <span className="leading-none">{t(key)}</span>
 {count > 0 && (
 <Badge
 variant="destructive"
 size="sm"
 className="absolute right-2 top-1 h-4 min-w-[1rem] px-1"
 aria-hidden="true"
 >
 {count > 9 ? "9+" : count}
 </Badge>
 )}
 </Link>
 </li>
 );
 })}
 </ul>
 </BottomNavShell>
 );
}
