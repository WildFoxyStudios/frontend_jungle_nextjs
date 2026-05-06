"use client";

import { useTranslations } from "next-intl";
import { SidebarShell } from "@jungle/ui";
import { MainNavList } from "./main-nav";

export function Sidebar() {
 const t = useTranslations("nav");

 return (
 <SidebarShell width="lg" aria-label={t("mainNavigation")} className="hidden md:block pt-safe">
 <MainNavList />
 </SidebarShell>
 );
}
