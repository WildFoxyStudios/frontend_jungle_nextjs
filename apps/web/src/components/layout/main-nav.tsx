"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRealtimeStore } from "@jungle/hooks";
import { Badge, Button } from "@jungle/ui";
import {
 Sparkles,
 GripVertical,
} from "lucide-react";
import {
 NAV_ORDER_STORAGE_KEY,
 NAV_SECTIONS,
 type NavSectionKey,
 cloneNavSections,
 applyPersistedNavOrder,
 parseNavOrderJson,
 readNavOrderFromStorage,
 writeNavOrderToStorage,
 clearNavOrderStorage,
 moveLinkInSection,
 moveSectionByIndex,
} from "@/lib/main-nav-sections";
import { applyExcludedToSections } from "@/lib/nav-env-exclusions";

const DND_TYPE = "text/plain";

type ParsedNavDrag =
 | { kind: "link"; sectionKey: NavSectionKey; fromIndex: number }
 | { kind: "section"; fromIndex: number };

function parseNavDragPayload(raw: string): ParsedNavDrag | null {
 try {
 const o = JSON.parse(raw) as {
 t?: string;
 sectionKey?: string;
 fromIndex?: unknown;
 };
 if (o.t === "sec" && typeof o.fromIndex === "number") {
 return { kind: "section", fromIndex: o.fromIndex };
 }
 const fromIndex =
 typeof o.fromIndex === "number" ? o.fromIndex : Number.NaN;
 const skOk =
 typeof o.sectionKey === "string" &&
 NAV_SECTIONS.some((s) => s.sectionKey === o.sectionKey);
 if (
 Number.isFinite(fromIndex) &&
 skOk &&
 (o.t === "link" || o.t === undefined)
 ) {
 return {
 kind: "link",
 sectionKey: o.sectionKey as NavSectionKey,
 fromIndex: fromIndex as number,
 };
 }
 } catch {
 /* ignore */
 }
 return null;
}

export function MainNavList({
 onLinkClick,
 reorderable = false,
}: {
 onLinkClick?: () => void;
 /** Desktop sidebar: drag handles + reset. Mobile sheet should use `false`. */
 reorderable?: boolean;
}) {
 const pathname = usePathname();
 const t = useTranslations("nav");
 const { unreadMessages, unreadNotifications } = useRealtimeStore();
 const [sections, setSections] = useState(() =>
 applyExcludedToSections(cloneNavSections(NAV_SECTIONS)),
 );
 const [draggingKey, setDraggingKey] = useState<string | null>(null);
 const [draggingSectionIndex, setDraggingSectionIndex] = useState<number | null>(null);

 useEffect(() => {
 const persisted = readNavOrderFromStorage();
 setSections(applyExcludedToSections(applyPersistedNavOrder(NAV_SECTIONS, persisted)));
 }, []);

 /** Same order as other tabs when `localStorage` changes (event only fires in other documents). */
 useEffect(() => {
 const onStorage = (e: StorageEvent) => {
 if (e.key !== NAV_ORDER_STORAGE_KEY || e.storageArea !== localStorage) return;
 setSections(applyExcludedToSections(applyPersistedNavOrder(NAV_SECTIONS, parseNavOrderJson(e.newValue))));
 };
 window.addEventListener("storage", onStorage);
 return () => window.removeEventListener("storage", onStorage);
 }, []);

 const getBadge = (badge?: string) => {
 if (badge === "messages") return unreadMessages;
 if (badge === "notifications") return unreadNotifications;
 return 0;
 };

 /** Keyboard ↑/↓ — swap with neighbor (clearer than index math after removal). */
 const swapAdjacentLink = useCallback((sectionKey: NavSectionKey, i: number, j: number) => {
 setSections((prev) => {
 const next = cloneNavSections(prev);
 const sec = next.find((s) => s.sectionKey === sectionKey);
 if (!sec) return prev;
 if (i < 0 || j < 0 || i >= sec.links.length || j >= sec.links.length) return prev;
 const links = [...sec.links];
 [links[i], links[j]] = [links[j], links[i]];
 sec.links = links;
 writeNavOrderToStorage(next);
 return next;
 });
 }, []);

 const resetOrder = useCallback(() => {
 clearNavOrderStorage();
 setSections(applyExcludedToSections(cloneNavSections(NAV_SECTIONS)));
 }, []);

 const swapAdjacentSection = useCallback((i: number, j: number) => {
 setSections((prev) => {
 if (i < 0 || j < 0 || i >= prev.length || j >= prev.length || i === j) return prev;
 const next = cloneNavSections(prev);
 const a = next[i];
 const b = next[j];
 if (!a || !b) return prev;
 next[i] = b;
 next[j] = a;
 writeNavOrderToStorage(next);
 return next;
 });
 }, []);

 const onDragStartRow = useCallback(
 (e: React.DragEvent, sectionKey: NavSectionKey, fromIndex: number, rowKey: string) => {
 e.dataTransfer.setData(DND_TYPE, JSON.stringify({ t: "link", sectionKey, fromIndex }));
 e.dataTransfer.effectAllowed = "move";
 setDraggingKey(rowKey);
 },
 [],
 );

 const onDragEndRow = useCallback(() => {
 setDraggingKey(null);
 }, []);

 const onDragStartSection = useCallback((e: React.DragEvent, sectionIndex: number) => {
 e.dataTransfer.setData(DND_TYPE, JSON.stringify({ t: "sec", fromIndex: sectionIndex }));
 e.dataTransfer.effectAllowed = "move";
 setDraggingSectionIndex(sectionIndex);
 }, []);

 const onDragEndSection = useCallback(() => {
 setDraggingSectionIndex(null);
 }, []);

 const onDragOverRow = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = "move";
 }, []);

 const onDragOverSectionDropZone = useCallback((e: React.DragEvent) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = "move";
 }, []);

 const onDropRow = useCallback((e: React.DragEvent, sectionKey: NavSectionKey, targetHref: string) => {
 e.preventDefault();
 const payload = parseNavDragPayload(e.dataTransfer.getData(DND_TYPE));
 if (!payload || payload.kind !== "link") return;
 if (payload.sectionKey !== sectionKey) return;
 setSections((prev) => {
 const sec = prev.find((s) => s.sectionKey === sectionKey);
 if (!sec) return prev;
 const toIndex = sec.links.findIndex((l) => l.href === targetHref);
 if (toIndex < 0 || payload.fromIndex === toIndex) return prev;
 const next = moveLinkInSection(prev, sectionKey, payload.fromIndex, toIndex);
 writeNavOrderToStorage(next);
 return next;
 });
 setDraggingKey(null);
 }, []);

 const onDropSection = useCallback((e: React.DragEvent, targetSectionIndex: number) => {
 e.preventDefault();
 const payload = parseNavDragPayload(e.dataTransfer.getData(DND_TYPE));
 if (!payload || payload.kind !== "section") return;
 const { fromIndex } = payload;
 if (fromIndex === targetSectionIndex) return;
 setSections((prev) => {
 const next = moveSectionByIndex(prev, fromIndex, targetSectionIndex);
 writeNavOrderToStorage(next);
 return next;
 });
 setDraggingSectionIndex(null);
 }, []);

 return (
 <nav
 className="flex flex-col gap-2 p-3"
 aria-label={t("mainNavigation")}
 data-testid="main-nav-list"
 >
 {sections.map((section, sectionIndex) => (
 <section
 key={section.sectionKey}
 aria-labelledby={`nav-heading-${section.sectionKey}`}
 className={[
 sectionIndex === 0 ? undefined : "border-t border-border pt-3",
 reorderable && draggingSectionIndex === sectionIndex ? "opacity-70" : "",
 ].filter(Boolean).join(" ")}
 onDragOver={reorderable ? onDragOverSectionDropZone : undefined}
 onDrop={reorderable ? (e) => onDropSection(e, sectionIndex) : undefined}
 >
 {/* Section header — subtle for Facebook-style, only on non-first sections */}
 {sectionIndex > 0 && (
 <div className="flex min-w-0 items-center gap-0 px-3 pb-1 md:gap-0.5">
 {reorderable ? (
 <button
 type="button"
 tabIndex={0}
 draggable
 aria-label={t("dragToReorderSection")}
 aria-grabbed={draggingSectionIndex === sectionIndex}
 onDragStart={(e) => onDragStartSection(e, sectionIndex)}
 onDragEnd={onDragEndSection}
 onKeyDown={(e) => {
 if (e.key === "ArrowUp" && sectionIndex > 0) {
 e.preventDefault();
 swapAdjacentSection(sectionIndex, sectionIndex - 1);
 } else if (e.key === "ArrowDown" && sectionIndex < sections.length - 1) {
 e.preventDefault();
 swapAdjacentSection(sectionIndex, sectionIndex + 1);
 }
 }}
 className={[
 "hidden shrink-0 touch-none cursor-grab place-items-center rounded border border-transparent",
 "hover:bg-muted/50 active:cursor-grabbing",
 "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
 "md:grid md:h-6 md:w-6",
 ].join(" ")}
 >
 <GripVertical className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
 </button>
 ) : null}
 <h3
 id={`nav-heading-${section.sectionKey}`}
 className="min-w-0 flex-1 truncate px-3 pt-3 pb-1 text-[13px] font-semibold text-muted-foreground"
 >
 {t(section.sectionKey)}
 </h3>
 </div>
 )}
 <div className="flex flex-col gap-1">
 {section.links.map(({ href, key, Icon, badge }, linkIndex) => {
 const count = getBadge(badge);
 const isActive = pathname === href || pathname.startsWith(href + "/");
 const rowKey = `${section.sectionKey}:${href}`;
 const isDragging = draggingKey === rowKey;
 return (
 <div
 key={href}
 className={[
 "flex min-w-0 items-stretch gap-0.5 rounded-md",
 isDragging ? "opacity-60" : "",
 ].join(" ")}
 onDragOver={reorderable ? onDragOverRow : undefined}
 onDrop={reorderable ? (e) => onDropRow(e, section.sectionKey, href) : undefined}
 >
 {reorderable ? (
 <button
 type="button"
 tabIndex={0}
 draggable
 aria-label={t("dragToReorderNav")}
 aria-grabbed={isDragging}
 onDragStart={(e) => onDragStartRow(e, section.sectionKey, linkIndex, rowKey)}
 onDragEnd={onDragEndRow}
 onKeyDown={(e) => {
 if (e.key === "ArrowUp" && linkIndex > 0) {
 e.preventDefault();
 swapAdjacentLink(section.sectionKey, linkIndex, linkIndex - 1);
 } else if (e.key === "ArrowDown" && linkIndex < section.links.length - 1) {
 e.preventDefault();
 swapAdjacentLink(section.sectionKey, linkIndex, linkIndex + 1);
 }
 }}
 className={[
 "hidden shrink-0 touch-none cursor-grab place-items-center rounded border border-transparent",
 "hover:border-foreground/30 hover:bg-secondary/50 active:cursor-grabbing",
 "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
 "md:grid md:h-auto md:w-7",
 ].join(" ")}
 >
 <GripVertical className="h-4 w-4 text-muted-foreground" aria-hidden />
 </button>
 ) : null}
 <Link
 href={href}
 aria-current={isActive ? "page" : undefined}
 onClick={() => onLinkClick?.()}
 className={[
 "flex min-w-0 flex-1 items-center gap-3 px-3 py-2 rounded-lg text-[15px] hover:bg-muted transition-colors",
 isActive
 ? "bg-primary-subtle font-semibold text-primary"
 : "text-foreground font-medium",
 ].join(" ")}
 >
 <Icon className="h-5 w-5 shrink-0" aria-hidden />
 <span className="flex-1 truncate">{t(key)}</span>
 {count > 0 && (
 <Badge variant="destructive" size="sm">
 {count > 99 ? "99+" : count}
 </Badge>
 )}
 </Link>
 </div>
 );
 })}
 </div>
 </section>
 ))}

 {reorderable ? (
 <div className="px-3 pt-1">
 <Button
 type="button"
 variant="ghost"
 size="sm"
 className="h-auto w-full justify-start px-2 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"
 onClick={resetOrder}
 >
 {t("resetNavOrder")}
 </Button>
 </div>
 ) : null}
 </nav>
 );
}

export function GoProCard({ onNavigate }: { onNavigate?: () => void }) {
 const te = useTranslations("nav_extra");
 return (
 <div
 className={[
 "m-3 mt-2 p-4 text-accent-foreground rounded-lg",
 "border shadow-md",
 "bg-gradient-to-br from-accent via-accent to-primary",
 ].join(" ")}
 >
 <div className="flex items-center gap-2">
 <Sparkles className="h-4 w-4" strokeWidth={3} />
 <span className="text-xs font-semibold tracking-wide">
 {te("goPro")}
 </span>
 </div>
 <p className="mt-2 text-xs font-medium leading-snug">
 {te("upgradeDesc")}
 </p>
 <Button asChild size="sm" variant="default" className="mt-3 w-full">
 <Link href="/go-pro" onClick={() => onNavigate?.()}>
 {te("upgradeNow")}
 </Link>
 </Button>
 </div>
 );
}
