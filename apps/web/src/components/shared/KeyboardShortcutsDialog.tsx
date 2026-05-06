"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogHeader,
 DialogTitle,
} from "@jungle/ui";
import { Keyboard } from "lucide-react";

/** Cmd/Ctrl — search K, Alt — feed nav (see GlobalKeyboardShortcuts). */
const MOD_PRIMARY_TOKEN = "__MOD_PRIMARY__";
const MOD_ALT_TOKEN = "__MOD_ALT__";

type ShortcutRow = {
 rowKey: string;
 keys: string[];
 desc: string;
};

function useMacLike(): boolean {
 const [v, setV] = useState(false);
 useEffect(() => {
 const macLike =
 /Mac|iPhone|iPad|iPod/.test(navigator.platform) ||
 navigator.userAgent.includes("Mac OS");
 setV(macLike);
 }, []);
 return v;
}

function primaryModGlyph(macLike: boolean): string {
 return macLike ? "⌘" : "Ctrl";
}

function altModGlyph(macLike: boolean): string {
 return macLike ? "⌥" : "Alt";
}

interface KeyboardShortcutsDialogProps {
 open: boolean;
 onClose: () => void;
}

/**
 * Lists global nav (`GlobalKeyboardShortcuts`), feed row (`/feed` J/K/L/C/S), and composer submit.
 */
export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
 const t = useTranslations("keyboardShortcuts");
 const macLike = useMacLike();
 const modPrimary = primaryModGlyph(macLike);
 const modAlt = altModGlyph(macLike);

 const rows = useMemo((): ShortcutRow[] => {
 const esc = t("keyEsc");
 const subst = (parts: string[]): string[] =>
 parts.map((p) => {
 if (p === MOD_PRIMARY_TOKEN) return modPrimary;
 if (p === MOD_ALT_TOKEN) return modAlt;
 return p;
 });

 const defs = [
 { rowKey: "esc", keys: [esc], msgKey: "escape" as const },
 { rowKey: "help", keys: ["?"], msgKey: "showThisDialog" as const },
 { rowKey: "search", keys: [MOD_PRIMARY_TOKEN, "K"], msgKey: "focusSearch" as const },
 { rowKey: "home", keys: [MOD_ALT_TOKEN, "H"], msgKey: "goHomeFeed" as const },
 { rowKey: "msgs", keys: [MOD_ALT_TOKEN, "M"], msgKey: "goMessages" as const },
 { rowKey: "notif", keys: [MOD_ALT_TOKEN, "N"], msgKey: "goNotifications" as const },
 { rowKey: "prof", keys: [MOD_ALT_TOKEN, "P"], msgKey: "goProfile" as const },
 { rowKey: "fj", keys: ["J"], msgKey: "feedNextPost" as const },
 { rowKey: "fk", keys: ["K"], msgKey: "feedPrevPost" as const },
 { rowKey: "fl", keys: ["L"], msgKey: "feedReact" as const },
 { rowKey: "fc", keys: ["C"], msgKey: "feedCommentToggle" as const },
 { rowKey: "fs", keys: ["S"], msgKey: "feedShareDialog" as const },
 { rowKey: "pub", keys: [MOD_PRIMARY_TOKEN, "Enter"], msgKey: "composerSubmitPost" as const },
 ];

 return defs.map((d) => ({
 rowKey: d.rowKey,
 keys: subst(d.keys),
 desc: t(d.msgKey),
 }));
 }, [t, modPrimary, modAlt]);

 return (
 <Dialog open={open} onOpenChange={onClose}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2">
 <Keyboard className="h-5 w-5" aria-hidden /> {t("dialogTitle")}
 </DialogTitle>
 <DialogDescription className="sr-only">{t("dialogDescription")}</DialogDescription>
 </DialogHeader>
 <div className="space-y-1">
 {rows.map((row) => (
 <div
 key={row.rowKey}
 className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
 >
 <span className="text-sm text-muted-foreground">{row.desc}</span>
 <div className="flex shrink-0 items-center gap-1">
 {row.keys.map((k, i) => (
 <span key={`${row.rowKey}-${i}-${k}`}>
 {i > 0 && (
 <span className="text-muted-foreground text-xs mx-0.5">+</span>
 )}
 <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 font-mono text-xs font-medium">
 {k}
 </kbd>
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </DialogContent>
 </Dialog>
 );
}

export function useKeyboardShortcutsTrigger() {
 const [open, setOpen] = useState(false);

 useEffect(() => {
 const handler = (e: KeyboardEvent) => {
 if (e.key === "?" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
 e.preventDefault();
 setOpen(true);
 }
 if (e.key === "Escape" && open) setOpen(false);
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [open]);

 return { open, setOpen };
}
