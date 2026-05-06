import * as React from "react";
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
export declare function ConfirmDialog({ open, onOpenChange, title, description, confirmText, cancelText, variant, onConfirm, icon, }: ConfirmDialogProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=confirm-dialog.d.ts.map