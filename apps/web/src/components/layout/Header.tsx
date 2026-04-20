"use client";

import Link from "next/link";
import { useRealtimeStore } from "@jungle/hooks";
import { Button, Badge } from "@jungle/ui";
import { MessageCircle } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { SiteAlertsModal } from "./SiteAlertsModal";
import { UserMenu } from "./UserMenu";
import { 
  Plus, PenLine, FileText, Users, ShoppingCart, 
  Briefcase, Calendar, PlusCircle, Wallet 
} from "lucide-react";
import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@jungle/ui";

export function Header() {
  const { unreadMessages } = useRealtimeStore();
  const [balance, setBalance] = useState<number | null>(null);
  const t = useTranslations("header");
  const tc = useTranslations("common");

  useEffect(() => {
    paymentsApi.getWallet()
      .then(w => setBalance(w.balance))
      .catch(() => { /* non-critical: failure is silent */ });
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" role="banner">
      <div className="flex h-14 items-center gap-4 px-4">
        <Link href="/feed" className="md:hidden text-xl font-bold text-primary">Jungle</Link>
        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>
        <div className="flex items-center gap-1">
          {balance !== null && (
            <Button variant="ghost" asChild className="hidden sm:flex h-9 px-3 gap-2 bg-primary/5 hover:bg-primary/10 text-primary rounded-full transition-all">
                <Link href="/wallet">
                    <Wallet className="h-4 w-4" />
                    <span className="text-xs font-bold">${balance.toFixed(2)}</span>
                </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-widest px-2 py-1.5">{t("quickCreate")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/blogs/create" className="gap-3 cursor-pointer"><PenLine className="h-4 w-4 text-orange-500" /> {t("createBlog")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pages/create" className="gap-3 cursor-pointer"><FileText className="h-4 w-4 text-blue-500" /> {t("createPage")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/groups/create" className="gap-3 cursor-pointer"><Users className="h-4 w-4 text-green-500" /> {t("createGroup")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/marketplace/create" className="gap-3 cursor-pointer"><ShoppingCart className="h-4 w-4 text-purple-500" /> {t("createProduct")}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/jobs/create" className="gap-3 cursor-pointer"><Briefcase className="h-4 w-4 text-teal-500" /> {t("postJob")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/events/create" className="gap-3 cursor-pointer"><Calendar className="h-4 w-4 text-rose-500" /> {t("createEvent")}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link href="/messages" aria-label={unreadMessages > 0 ? `${tc("messages")} (${unreadMessages})` : tc("messages")}>
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
          <SiteAlertsModal />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
