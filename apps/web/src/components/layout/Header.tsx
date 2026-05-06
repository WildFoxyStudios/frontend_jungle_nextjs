"use client";

import Link from "next/link";
import { Button, TopbarShell } from "@jungle/ui";
import { SearchBar } from "./SearchBar";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { MessagesDropdown } from "./MessagesDropdown";
import { SiteAlertsModal } from "./SiteAlertsModal";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { MobileNavSheet } from "./MobileNavSheet";
import { HeaderMoreMenu } from "./HeaderMoreMenu";
import {
 Wallet,
 Shield,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@jungle/hooks";
import { getAdminPanelUrl, userCanAccessAdminPanel } from "@/lib/admin-panel";
import { useStaffFlagsSync } from "@/hooks/use-staff-flags-sync";

/**
 * Facebook-style top bar.
 *
 * Left: hamburger (mobile) · logo
 * Center: large pill search bar
 * Right: wallet · admin · messages · notifications · theme/lang · user avatar
 *
 * Breakpoint visibility:
 * | Breakpoint | Always visible | Plus this tier |
 * |-------------------|----------------|----------------|
 * | default (< sm) | hamburger · logo · search (icon) · notifications · user | — |
 * | sm+ | + messages · admin (if staff) | |
 * | md+ | + right-rail trigger · site-alerts | |
 * | lg+ | + wallet · theme · language | |
 */
export function Header() {
 const [balance, setBalance] = useState<number | null>(null);
 const { user } = useAuthStore();
 const tn = useTranslations("nav_extra");
 const adminPanelUrl = getAdminPanelUrl();
 const showAdminEntry = userCanAccessAdminPanel(user);
 useStaffFlagsSync();

 useEffect(() => {
 paymentsApi
 .getWallet()
 .then((w) => setBalance(Number(w.balance) || 0))
 .catch(() => {
 /* non-critical */
 });
 }, []);

 return (
 <TopbarShell>
 <div className="relative flex h-14 min-w-0 items-center gap-2 px-2 pl-safe pr-safe sm:gap-3 sm:px-4">
 {/* Left — hamburger (mobile) + Facebook-style logo */}
 <div className="flex shrink-0 items-center gap-1">
 <MobileNavSheet />
 <Link
 href="/feed"
 aria-label="Jungle home"
 className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
 >
 f
 </Link>
 </div>

 {/* Center — large Facebook-style search pill */}
 <div className="flex min-w-0 flex-1 justify-center px-1">
 <Suspense
 fallback={
 <div
 className="h-10 w-full max-w-[480px] rounded-full bg-muted/50"
 aria-hidden
 />
 }
 >
 <SearchBar compact collapseOnMobile className="w-full max-w-[480px]" />
 </Suspense>
 </div>

 {/* Right — simplified Facebook-style icons */}
 <div className="flex shrink-0 items-center justify-end gap-0.5 sm:gap-1">
 {/* Wallet — lg+ */}
 {balance !== null && (
 <Button
 asChild
 variant="secondary"
 size="sm"
 className="hidden shrink-0 rounded-full lg:inline-flex"
 >
 <Link
 href="/wallet"
 aria-label={`${tn("wallet")}: $${balance.toFixed(2)}`}
 >
 <Wallet className="h-4 w-4" />
 <span className="text-[13px] font-semibold">
 ${Number(balance).toFixed(2)}
 </span>
 </Link>
 </Button>
 )}

 {/* Admin panel — always visible for staff */}
 {showAdminEntry && (
 <Button
 asChild
 variant="ghost"
 size="icon"
 className="h-10 w-10 shrink-0 rounded-full"
 aria-label={tn("adminPanel")}
 >
 <a href={adminPanelUrl} target="_blank" rel="noopener noreferrer">
 <Shield className="h-5 w-5" aria-hidden />
 </a>
 </Button>
 )}

 {/* Messages — sm+ */}
 <div className="hidden sm:block">
 <MessagesDropdown />
 </div>

 {/* Notifications — always visible */}
 <NotificationsDropdown />

 {/* Site alerts — md+ */}
 <div className="hidden md:block">
 <SiteAlertsModal />
 </div>

 {/* Theme + Language — lg+ */}
 <div className="hidden shrink-0 lg:flex">
 <ThemeToggle />
 <LanguageSwitcher />
 </div>

 {/* Overflow menu (wallet/theme/lang) — < lg */}
 <HeaderMoreMenu balance={balance} />

 {/* User avatar — always visible */}
 <div className="shrink-0 pl-0.5">
 <UserMenu />
 </div>
 </div>
 </div>
 </TopbarShell>
 );
}
