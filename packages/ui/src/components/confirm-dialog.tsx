"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";

/** Variant controls the primary action's color scheme. */
export type ConfirmDialogVariant = "default" | "destructive";

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Called when the dialog requests to close (e.g. cancel, esc, overlay click). */
  onOpenChange: (open: boolean) => void;
  /** Dialog title — short, imperative (e.g. "Delete post?"). */
  title: React.ReactNode;
  /** Optional description paragraph below the title. */
  description?: React.ReactNode;
  /** Label for the confirm action. Defaults to "Confirm". */
  confirmText?: string;
  /** Label for the cancel action. Defaults to "Cancel". */
  cancelText?: string;
  /** Variant of the primary button. Use "destructive" for deletes/kicks/bans. */
  variant?: ConfirmDialogVariant;
  /**
   * Handler fired when the user confirms. May be async — while pending, the
   * confirm button shows a loading state and both buttons are disabled.
   */
  onConfirm: () => void | Promise<void>;
  /** Optional icon rendered next to the title. */
  icon?: React.ReactNode;
}

/**
 * Unified confirmation dialog — replaces every `window.confirm()` call-site
 * for design-system consistency. Built on Radix `AlertDialog`.
 *
 * Example:
 * ```tsx
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>Delete</Button>
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   variant="destructive"
 *   title="Delete this post?"
 *   description="This action cannot be undone."
 *   confirmText="Delete"
 *   onConfirm={async () => { await api.deletePost(id); }}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  icon,
}: ConfirmDialogProps) {
  const [pending, setPending] = React.useState(false);

  const handleConfirm = async (e: React.MouseEvent) => {
    // Radix closes the dialog on click by default; we defer closing until the
    // async handler resolves so an in-flight request can't be orphaned.
    e.preventDefault();
    try {
      setPending(true);
      await onConfirm();
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={pending}
            className={cn(
              variant === "destructive" &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {pending ? `${confirmText}\u2026` : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
