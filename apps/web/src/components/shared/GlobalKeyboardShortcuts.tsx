"use client";

import { useKeyboardShortcutsTrigger, KeyboardShortcutsDialog } from "./KeyboardShortcutsDialog";

export function GlobalKeyboardShortcuts() {
  const { open, setOpen } = useKeyboardShortcutsTrigger();
  return <KeyboardShortcutsDialog open={open} onClose={() => setOpen(false)} />;
}
