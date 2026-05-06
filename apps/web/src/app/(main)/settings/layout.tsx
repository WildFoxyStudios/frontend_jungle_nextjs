"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { cn } from "@jungle/ui";

type NavItem = { href: string; key: string };

const SETTINGS_SECTIONS: {
 sectionTitleKey: string;
 /** Destructive / delete — subtle emphasis in sidebar */
 tone?: "danger";
 items: NavItem[];
}[] = [
 {
 sectionTitleKey: "sectionAccountAndProfile",
 items: [
 { href: "/settings", key: "general" },
 { href: "/settings/profile", key: "profile" },
 { href: "/settings/design", key: "design" },
 { href: "/settings/social-links", key: "socialLinks" },
 { href: "/settings/profile-fields", key: "profileFields" },
 { href: "/settings/experience", key: "experience" },
 { href: "/settings/certifications", key: "certifications" },
 { href: "/settings/projects", key: "projects" },
 { href: "/settings/open-to-work", key: "openToWork" },
 { href: "/settings/information", key: "information" },
 { href: "/settings/addresses", key: "addresses" },
 { href: "/settings/invitations", key: "invitations" },
 ],
 },
 {
 sectionTitleKey: "sectionPrivacyAndSecurity",
 items: [
 { href: "/settings/privacy", key: "privacy" },
 { href: "/settings/security", key: "security" },
 { href: "/settings/sessions", key: "sessions" },
 { href: "/settings/blocked", key: "blocked" },
 { href: "/settings/verification", key: "verification" },
 ],
 },
 {
 sectionTitleKey: "sectionNotifications",
 items: [{ href: "/settings/notifications", key: "notifications" }],
 },
 {
 sectionTitleKey: "sectionPaymentsAndMonetization",
 items: [
 { href: "/settings/monetization", key: "monetization" },
 { href: "/settings/tiers", key: "tiers" },
 { href: "/settings/points", key: "points" },
 { href: "/settings/affiliates", key: "affiliates" },
 { href: "/settings/referrals", key: "referrals" },
 { href: "/settings/payments", key: "payments" },
 { href: "/settings/transactions", key: "transactions" },
 ],
 },
 {
 sectionTitleKey: "sectionDangerZone",
 tone: "danger",
 items: [{ href: "/settings/delete-account", key: "deleteAccount" }],
 },
];

function isNavActive(pathname: string, href: string) {
 return href === "/settings" ? pathname === href : pathname.startsWith(href);
}

function SettingsNavSection({
 title,
 pathname,
 items,
 tone,
 children,
}: {
 title: string;
 pathname: string;
 items: NavItem[];
 tone?: "danger";
 children: ReactNode;
}) {
 const hasActive = items.some((i) => isNavActive(pathname, i.href));
 const [open, setOpen] = useState(hasActive);

 useEffect(() => {
 if (hasActive) setOpen(true);
 }, [hasActive]);

 return (
 <div
 className={cn(
 "overflow-hidden border border-foreground/90 first:rounded-t-md last:rounded-b-md not-first:border-t-0",
 tone === "danger" && "border-destructive/60",
 )}
 >
 <button
 type="button"
 className={cn(
 "flex w-full items-center justify-between gap-2 bg-secondary/50 px-2 py-2 text-left text-xs font-semibold text-foreground hover:bg-secondary",
 tone === "danger" && "bg-destructive/10 hover:bg-destructive/15",
 )}
 onClick={() => setOpen((v) => !v)}
 aria-expanded={open}
 >
 <span className="min-w-0 truncate">{title}</span>
 <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
 </button>
 {open && (
 <div
 className={cn(
 "space-y-1 border-t border-foreground/40 bg-card p-1.5",
 tone === "danger" && "border-destructive/30",
 )}
 >
 {children}
 </div>
 )}
 </div>
 );
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
 const pathname = usePathname();
 const t = useTranslations("settings_nav");
 const tf = useTranslations("footer");

 return (
 <div className="mx-auto flex max-w-5xl gap-6 px-4 py-4">
 <aside className="hidden w-64 shrink-0 md:block">
 <nav className="" aria-label={t("sidebarAria")}>
 {SETTINGS_SECTIONS.map((section) => (
 <SettingsNavSection
 key={section.sectionTitleKey}
 title={t(section.sectionTitleKey)}
 pathname={pathname}
 items={section.items}
 tone={section.tone}
 >
 {section.items.map(({ href, key }) => {
 const isActive = isNavActive(pathname, href);
 return (
 <Link
 key={href}
 href={href}
 className={cn(
 "block border px-3 py-2 text-[15px] font-semibold transition-all",
 section.tone === "danger" &&
 "border-transparent text-destructive hover:border-destructive hover:bg-destructive/10",
 !section.tone &&
 (isActive
 ? "border-foreground bg-primary text-primary-foreground"
 : "border-transparent text-foreground hover:border-foreground hover:bg-secondary"),
 section.tone === "danger" &&
 isActive &&
 "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive",
 )}
 >
 {t(key)}
 </Link>
 );
 })}
 </SettingsNavSection>
 ))}
 </nav>
 <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 border-t border-dashed border-foreground/25 pt-4 text-[13px] font-medium">
 <Link href="/terms" className="text-primary underline underline-offset-2 hover:no-underline">
 {tf("terms")}
 </Link>
 <Link href="/privacy" className="text-primary underline underline-offset-2 hover:no-underline">
 {tf("privacy")}
 </Link>
 <Link href="/contact" className="text-primary underline underline-offset-2 hover:no-underline">
 {tf("contact")}
 </Link>
 </div>
 </aside>
 <div className="min-w-0 flex-1 space-y-4">
 <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 border-b border-dashed border-foreground/20 pb-3 md:hidden">
 <Link href="/terms" className="text-[13px] font-medium text-primary underline underline-offset-2">
 {tf("terms")}
 </Link>
 <Link href="/privacy" className="text-[13px] font-medium text-primary underline underline-offset-2">
 {tf("privacy")}
 </Link>
 <Link href="/contact" className="text-[13px] font-medium text-primary underline underline-offset-2">
 {tf("contact")}
 </Link>
 </div>
 <main className="min-w-0">{children}</main>
 </div>
 </div>
 );
}
