"use client";

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@jungle/ui";
import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["J"], description: "Next post" },
  { keys: ["K"], description: "Previous post" },
  { keys: ["L"], description: "Like current post" },
  { keys: ["C"], description: "Open comments" },
  { keys: ["S"], description: "Share post" },
  { keys: ["Esc"], description: "Close dialog / go back" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["Ctrl", "K"], description: "Focus search bar" },
  { keys: ["Ctrl", "Enter"], description: "Submit form / publish post" },
  { keys: ["Alt", "H"], description: "Go to Home feed" },
  { keys: ["Alt", "M"], description: "Go to Messages" },
  { keys: ["Alt", "N"], description: "Go to Notifications" },
];

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsDialog({ open, onClose }: KeyboardShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" /> Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          {SHORTCUTS.map(({ keys, description }) => (
            <div key={keys.join("+")} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{description}</span>
              <div className="flex items-center gap-1">
                {keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 && <span className="text-muted-foreground text-xs mx-0.5">+</span>}
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
