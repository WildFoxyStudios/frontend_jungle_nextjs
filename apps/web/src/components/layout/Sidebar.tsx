"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRealtimeStore } from "@jungle/hooks";
import { Badge, Card, Button } from "@jungle/ui";
import {
  Home, Compass, MessageCircle, Bell, BookOpen, Film, Users, FileText,
  Calendar, ShoppingCart, PenLine, Briefcase, DollarSign, Tv, Gamepad2,
  MessageSquare, Bookmark, Clock, Radio, UserPlus, UserCheck, Clapperboard,
  Sparkles, LayoutGrid, Wallet, MapPin, Tag, CreditCard, Handshake, type LucideIcon,
} from "lucide-react";

const NAV_LINKS: { href: string; key: string; Icon: LucideIcon; badge?: string }[] = [
  { href: "/feed", key: "feed", Icon: Home },
  { href: "/explore", key: "explore", Icon: Compass },
  { href: "/messages", key: "messages", Icon: MessageCircle, badge: "messages" },
  { href: "/notifications", key: "notifications", Icon: Bell, badge: "notifications" },
  { href: "/stories", key: "stories", Icon: BookOpen },
  { href: "/reels", key: "reels", Icon: Film },
  { href: "/groups", key: "groups", Icon: Users },
  { href: "/pages", key: "pages", Icon: FileText },
  { href: "/events", key: "events", Icon: Calendar },
  { href: "/marketplace", key: "marketplace", Icon: ShoppingCart },
  { href: "/blogs", key: "blogs", Icon: PenLine },
  { href: "/jobs", key: "jobs", Icon: Briefcase },
  { href: "/funding", key: "funding", Icon: DollarSign },
  { href: "/watch", key: "watch", Icon: Tv },
  { href: "/games", key: "games", Icon: Gamepad2 },
  { href: "/forums", key: "forums", Icon: MessageSquare },
  { href: "/saved", key: "saved", Icon: Bookmark },
  { href: "/memories", key: "memories", Icon: Clock },
  { href: "/live", key: "live", Icon: Radio },
  { href: "/movies", key: "movies", Icon: Clapperboard },
  { href: "/most-liked", key: "mostLiked", Icon: Sparkles },
  { href: "/directory", key: "directory", Icon: LayoutGrid },
  { href: "/friends", key: "friends", Icon: UserCheck },
  { href: "/profile/follow-requests", key: "followRequests", Icon: UserPlus },
  { href: "/pokes", key: "pokes", Icon: Handshake },
  { href: "/nearby", key: "nearby", Icon: MapPin },
  { href: "/offers", key: "offers", Icon: Tag },
  { href: "/subscriptions", key: "subscriptions", Icon: CreditCard },
  { href: "/open-to-work-posts", key: "openToWorkPosts", Icon: Briefcase },
  { href: "/wallet", key: "wallet", Icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const te = useTranslations("nav_extra");
  const { unreadMessages, unreadNotifications } = useRealtimeStore();

  const getBadge = (badge?: string) => {
    if (badge === "messages") return unreadMessages;
    if (badge === "notifications") return unreadNotifications;
    return 0;
  };

  return (
    <nav aria-label="Main navigation" className="hidden md:flex flex-col w-64 border-r bg-background h-screen sticky top-0 overflow-y-auto p-4 gap-1">
      <div className="mb-4 px-2">
        <Link href="/feed" className="text-xl font-bold text-primary">Jungle</Link>
      </div>
      {NAV_LINKS.map(({ href, key, Icon, badge }) => {
        const count = getBadge(badge);
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-foreground"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t(key)}</span>
            {count > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {count > 99 ? "99+" : count}
              </Badge>
            )}
          </Link>
        );
      })}
      
      <div className="mt-4 px-2">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4 fill-primary" />
            <span className="text-xs font-bold uppercase tracking-widest">{te("goPro")}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">
            {te("upgradeDesc")}
          </p>
          <Button asChild size="sm" className="w-full font-bold h-8 rounded-lg shadow-sm">
            <Link href="/go-pro">{te("upgradeNow")}</Link>
          </Button>
        </Card>
      </div>
    </nav>
  );
}
