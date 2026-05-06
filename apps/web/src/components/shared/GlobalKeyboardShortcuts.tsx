"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@jungle/hooks";
import { useKeyboardShortcutsTrigger, KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

const ALT_NAV_TARGETS: Record<string, string> = {
 KeyH: "/feed",
 KeyM: "/messages",
 KeyN: "/notifications",
};

/**
 * Mounts the global "?" → KeyboardShortcutsDialog trigger and a small
 * router-aware shortcut layer for navigation (Alt+H/M/N/P → feed, messages,
 * notifications, profile) plus Cmd/Ctrl+K to focus the global search.
 * Keystrokes that originate from form fields are ignored (except Cmd/Ctrl+K).
 */
export function GlobalKeyboardShortcuts() {
 const { open, setOpen } = useKeyboardShortcutsTrigger();
 const router = useRouter();
 const profileName = useAuthStore((s) => s.user?.username);

 useEffect(() => {
 const isEditable = (el: EventTarget | null) => {
 if (!(el instanceof HTMLElement)) return false;
 const tag = el.tagName;
 return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
 };

 const onKey = (e: KeyboardEvent) => {
 // Cmd/Ctrl+K → focus the global search bar.
 if ((e.metaKey || e.ctrlKey) && e.code === "KeyK") {
 e.preventDefault();
 const input = document.querySelector<HTMLInputElement>("[data-global-search] input");
 if (!input) {
 document.querySelector<HTMLElement>("[data-global-search-expand]")?.click();
 requestAnimationFrame(() => {
 requestAnimationFrame(() => {
 const el = document.querySelector<HTMLInputElement>("[data-global-search] input");
 el?.focus({ preventScroll: true });
 el?.select?.();
 });
 });
 } else {
 input.focus({ preventScroll: true });
 input.select?.();
 }
 return;
 }

 if (isEditable(e.target)) return;

 // Alt+letter navigation
 if (e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
 const target =
 e.code === "KeyP" && profileName
 ? `/profile/${profileName}`
 : ALT_NAV_TARGETS[e.code];
 if (target) {
 e.preventDefault();
 router.push(target);
 }
 }
 };
 document.addEventListener("keydown", onKey);
 return () => document.removeEventListener("keydown", onKey);
 }, [router, profileName]);

 return <KeyboardShortcutsDialog open={open} onClose={() => setOpen(false)} />;
}
