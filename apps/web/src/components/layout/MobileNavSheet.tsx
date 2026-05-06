"use client";

import { useState, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Button, ScrollArea } from "@jungle/ui";
import {
 Briefcase,
 Calendar,
 FileText,
 Menu,
 PenLine,
 ShoppingCart,
 UserPlus,
 Users,
 X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { GoProCard, MainNavList } from "./main-nav";

/** Narrow viewports: Sunshine-style hamburger that opens the main nav drawer. */
export function MobileNavSheet() {
 const [open, setOpen] = useState(false);
 const [mounted, setMounted] = useState(false);
 const dialogId = useId();
 const titleId = useId();
 const menuButtonRef = useRef<HTMLButtonElement>(null);
 const panelRef = useRef<HTMLElement>(null);
 const wasOpen = useRef(false);
 const t = useTranslations("nav");
 const th = useTranslations("header");
 const tc = useTranslations("common");

 const close = () => setOpen(false);

 useEffect(() => setMounted(true), []);

 useEffect(() => {
 if (!open) return;
 const prevOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";

 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") close();
 };
 document.addEventListener("keydown", onKey);

 const t = window.requestAnimationFrame(() => {
 const root = panelRef.current;
 const first = root?.querySelector<HTMLElement>('a[href], button:not([aria-hidden="true"])');
 first?.focus();
 });

 return () => {
 document.body.style.overflow = prevOverflow;
 document.removeEventListener("keydown", onKey);
 window.cancelAnimationFrame(t);
 };
 }, [open]);

 useEffect(() => {
 if (wasOpen.current && !open) menuButtonRef.current?.focus();
 wasOpen.current = open;
 }, [open]);

 /** Mirror the desktop "quick create" dropdown so mobile users still get the same shortcuts. */
 const quickCreateItems = [
 { href: "/blogs/create", icon: PenLine, label: th("createBlog") },
 { href: "/pages/create", icon: FileText, label: th("createPage") },
 { href: "/groups/create", icon: Users, label: th("createGroup") },
 { href: "/marketplace/create", icon: ShoppingCart, label: th("createProduct") },
 { href: "/jobs/create", icon: Briefcase, label: th("postJob") },
 { href: "/events/create", icon: Calendar, label: th("createEvent") },
 ];

 const drawer =
 open &&
 mounted &&
 createPortal(
 <>
 <div
 className="fixed inset-0 z-[100] bg-foreground/70 backdrop-blur-[2px] animate-in fade-in-0 duration-200"
 aria-hidden
 onClick={close}
 />
 <aside
 id={dialogId}
 ref={panelRef}
 role="dialog"
 aria-modal="true"
 aria-labelledby={titleId}
 className={[
 "fixed inset-y-0 left-0 z-[101] flex h-dvh w-[min(100vw-0.5rem,22rem)] flex-col gap-0",
 "border-r bg-card shadow-elevated-lg",
 "neo-glass-strong animate-in duration-300 slide-in-from-left",
 "pt-safe pb-safe",
 ].join(" ")}
 >
 <div className="relative shrink-0 space-y-0 border-b bg-secondary px-4 py-3 text-left">
 <h2
 id={titleId}
 className="font-semibold text-base text-secondary-foreground"
 >
 <Link href="/feed" onClick={close}>
 Jungle
 </Link>
 </h2>
 <button
 type="button"
 className={[
 "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md",
 " transition-all hover:bg-destructive hover:text-destructive-foreground",
 "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
 ].join(" ")}
 onClick={close}
 aria-label={tc("close")}
 >
 <X className="h-4 w-4" aria-hidden />
 </button>
 </div>
 <ScrollArea className="min-h-0 flex-1">
 <MainNavList onLinkClick={close} reorderable={false} />
 <p className="px-4 pb-2 pt-1 text-[10px] leading-snug text-muted-foreground">{t("navReorderHint")}</p>

 <div className="space-y-1 border-t px-3 py-3">
 <p className="px-2 pb-1 text-[13px] font-semibold text-muted-foreground">
 {th("quickCreate")}
 </p>
 <Link
 href="/profile/follow-requests"
 onClick={close}
 className="flex items-center gap-3 border border-transparent px-3 py-2 text-[15px] font-semibold transition-all hover:bg-muted/50 rounded-md"
 >
 <UserPlus className="h-4 w-4 shrink-0" />
 <span>{t("followRequests")}</span>
 </Link>
 {quickCreateItems.map(({ href, icon: Icon, label }) => (
 <Link
 key={href}
 href={href}
 onClick={close}
 className="flex items-center gap-3 border border-transparent px-3 py-2 text-[15px] font-semibold transition-all hover:bg-muted/50 rounded-md"
 >
 <Icon className="h-4 w-4 shrink-0" />
 <span>{label}</span>
 </Link>
 ))}
 </div>

 <GoProCard onNavigate={close} />
 </ScrollArea>
 </aside>
 </>,
 document.body,
 );

 return (
 <div className="shrink-0 md:hidden">
 <Button
 ref={menuButtonRef}
 type="button"
 variant="outline"
 size="icon"
 className="h-10 w-10 shrink-0 rounded-full hover:bg-muted/50"
 aria-label={t("mainNavigation")}
 aria-expanded={open}
 aria-haspopup="dialog"
 aria-controls={open ? dialogId : undefined}
 onClick={() => setOpen((v) => !v)}
 >
 <Menu className="h-5 w-5" aria-hidden />
 </Button>
 {drawer}
 </div>
 );
}
