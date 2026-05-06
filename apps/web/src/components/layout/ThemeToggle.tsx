"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Globe, Leaf, Monitor, Moon, Palette, Sun } from "lucide-react";
import {
 Button,
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@jungle/ui";
import { useTranslations } from "next-intl";

/**
 * Header theme preset — Light, Sunshine, Forest, Facebook, Dark, System.
 */
export function ThemeToggle() {
 const { theme, setTheme, resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const t = useTranslations("header");

 useEffect(() => {
 setMounted(true);
 }, []);

 const active = theme ?? "system";
 const isSunshine = active === "sunshine";
 const isFacebook = active === "facebook";
 const isForest = active === "forest";
 const isDark = mounted && resolvedTheme === "dark" && !isSunshine && !isFacebook && !isForest;

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <Button
 variant="ghost"
 size="icon"
 aria-label={t("toggleTheme")}
 title={t("toggleTheme")}
 >
 {mounted ? (
 isSunshine ? (
 <Palette className="h-5 w-5 text-amber-600" aria-hidden="true" />
 ) : isForest ? (
 <Leaf className="h-5 w-5 text-emerald-600" aria-hidden="true" />
 ) : isFacebook ? (
 <Globe className="h-5 w-5 text-blue-600" aria-hidden="true" />
 ) : isDark ? (
 <Moon className="h-5 w-5" aria-hidden="true" />
 ) : (
 <Sun className="h-5 w-5" aria-hidden="true" />
 )
 ) : (
 <Sun className="h-5 w-5 opacity-60" aria-hidden="true" />
 )}
 </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-[11rem]">
 <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
 <Sun className="h-4 w-4" />
 <span className="flex-1">{t("themeLight")}</span>
 {active === "light" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("sunshine")} className="gap-2">
 <Palette className="h-4 w-4 text-amber-600" aria-hidden />
 <span className="flex-1">{t("themeSunshine")}</span>
 {active === "sunshine" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("forest")} className="gap-2">
 <Leaf className="h-4 w-4 text-emerald-600" aria-hidden />
 <span className="flex-1">{t("themeForest")}</span>
 {active === "forest" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("facebook")} className="gap-2">
 <Globe className="h-4 w-4 text-blue-600" aria-hidden />
 <span className="flex-1">{t("themeFacebook")}</span>
 {active === "facebook" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
 <Moon className="h-4 w-4" />
 <span className="flex-1">{t("themeDark")}</span>
 {active === "dark" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
 <Monitor className="h-4 w-4" />
 <span className="flex-1">{t("themeSystem")}</span>
 {active === "system" && <Check className="h-3.5 w-3.5" />}
 </DropdownMenuItem>
 </DropdownMenuContent>
 </DropdownMenu>
 );
}
