"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Check, Globe, Leaf, Monitor, Moon, MoreHorizontal, Palette, Shield, Sun, Wallet } from "lucide-react";
import {
 Button,
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
 ScrollArea,
} from "@jungle/ui";
import { LOCALE_PICKER_LIST } from "./LanguageSwitcher";
import { useAuthStore } from "@jungle/hooks";
import { getAdminPanelUrl, userCanAccessAdminPanel } from "@/lib/admin-panel";

function setLocaleCookie(locale: string) {
 document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

interface HeaderMoreMenuProps {
 balance: number | null;
}

/**
 * Collapses secondary header actions on smaller breakpoints (esp. Android)
 * so touch targets and search stay usable.
 */
export function HeaderMoreMenu({ balance }: HeaderMoreMenuProps) {
 const { user } = useAuthStore();
 const t = useTranslations("header");
 const tn = useTranslations("nav_extra");
 const adminUrl = getAdminPanelUrl();
 const showAdmin = userCanAccessAdminPanel(user);
 const { theme, setTheme, resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const router = useRouter();
 const currentLocale = useLocale();
 const [isPending, startTransition] = useTransition();
 const activeTheme = theme ?? "system";
 const themeIsSunshine = activeTheme === "sunshine";
 const themeIsForest = activeTheme === "forest";
 const themeIsFacebook = activeTheme === "facebook";
 const isDark = mounted && resolvedTheme === "dark" && !themeIsSunshine && !themeIsForest && !themeIsFacebook;

 useEffect(() => {
 setMounted(true);
 }, []);

 return (
 <div className="shrink-0 lg:hidden">
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 type="button"
 variant="outline"
 size="icon"
 className="h-10 w-10 rounded-full hover:bg-muted/50"
 aria-label={t("moreMenu")}
 >
 <MoreHorizontal className="h-5 w-5" aria-hidden />
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent
 align="end"
 sideOffset={8}
 className="w-[min(calc(100vw-1rem),16rem)] border shadow-md"
 >
 <DropdownMenuLabel className="font-semibold">
 {t("moreMenu")}
 </DropdownMenuLabel>
 <DropdownMenuSeparator className="bg-border" />
 {balance !== null && (
 <>
 <DropdownMenuItem asChild className="cursor-pointer font-semibold gap-2">
 <Link href="/wallet">
 <Wallet className="h-4 w-4 shrink-0" />${Number(balance).toFixed(2)}
 </Link>
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 </>
 )}
 {showAdmin && (
 <>
 <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold">
 <a href={adminUrl} target="_blank" rel="noopener noreferrer">
 <Shield className="h-4 w-4 shrink-0" />
 {tn("adminPanel")}
 </a>
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 </>
 )}
 <DropdownMenuItem asChild className="cursor-pointer gap-2 font-semibold">
 <Link href="/settings">{t("accountSettings")}</Link>
 </DropdownMenuItem>
 <DropdownMenuSeparator className="bg-border" />
 <DropdownMenuSub>
 <DropdownMenuSubTrigger className="font-semibold gap-2">
 {mounted ? (
 themeIsSunshine ? (
 <Palette className="h-4 w-4 text-amber-600" />
 ) : themeIsForest ? (
 <Leaf className="h-4 w-4 text-emerald-600" />
 ) : themeIsFacebook ? (
 <Globe className="h-4 w-4 text-blue-600" />
 ) : isDark ? (
 <Moon className="h-4 w-4" />
 ) : (
 <Sun className="h-4 w-4" />
 )
 ) : (
 <Sun className="h-4 w-4 opacity-70" />
 )}
 {t("toggleTheme")}
 </DropdownMenuSubTrigger>
 <DropdownMenuSubContent className="border shadow-md">
 <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 font-medium">
 <Sun className="h-4 w-4" />
 <span className="flex-1">{t("themeLight")}</span>
 {activeTheme === "light" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("sunshine")} className="gap-2 font-medium">
 <Palette className="h-4 w-4 text-amber-600" aria-hidden />
 <span className="flex-1">{t("themeSunshine")}</span>
 {activeTheme === "sunshine" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("forest")} className="gap-2 font-medium">
 <Leaf className="h-4 w-4 text-emerald-600" aria-hidden />
 <span className="flex-1">{t("themeForest")}</span>
 {activeTheme === "forest" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("facebook")} className="gap-2 font-medium">
 <Globe className="h-4 w-4 text-blue-600" aria-hidden />
 <span className="flex-1">{t("themeFacebook")}</span>
 {activeTheme === "facebook" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 font-medium">
 <Moon className="h-4 w-4" />
 <span className="flex-1">{t("themeDark")}</span>
 {activeTheme === "dark" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 font-medium">
 <Monitor className="h-4 w-4" />
 <span className="flex-1">{t("themeSystem")}</span>
 {activeTheme === "system" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 </DropdownMenuSubContent>
 </DropdownMenuSub>
 <DropdownMenuSub>
 <DropdownMenuSubTrigger disabled={isPending} className="font-semibold">
 {t("changeLanguage")}
 </DropdownMenuSubTrigger>
 <DropdownMenuSubContent className="border p-0 shadow-md">
 <ScrollArea className="max-h-[min(320px,50vh)]">
 {LOCALE_PICKER_LIST.map((locale) => (
 <DropdownMenuItem
 key={locale.code}
 onClick={() => {
 if (locale.code === currentLocale) return;
 setLocaleCookie(locale.code);
 startTransition(() => router.refresh());
 }}
 className="cursor-pointer gap-2 px-3 py-2"
 >
 <span aria-hidden className="text-base leading-none">
 {locale.flag}
 </span>
 <span className="flex-1 truncate text-sm">
 {locale.native}
 {locale.native !== locale.label && (
 <span className="ml-1 text-xs text-muted-foreground">
 ({locale.label})
 </span>
 )}
 </span>
 {currentLocale === locale.code && (
 <Check className="h-3.5 w-3.5 text-primary" />
 )}
 </DropdownMenuItem>
 ))}
 </ScrollArea>
 </DropdownMenuSubContent>
 </DropdownMenuSub>
 </DropdownMenuContent>
 </DropdownMenu>
 </div>
 );
}
