"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "./alert-dialog";
import { buttonVariants } from "./button";
import { cn } from "../lib/utils";
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
export function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "Confirm", cancelText = "Cancel", variant = "default", onConfirm, icon, }) {
    const [pending, setPending] = React.useState(false);
    const handleConfirm = async (e) => {
        // Radix closes the dialog on click by default; we defer closing until the
        // async handler resolves so an in-flight request can't be orphaned.
        e.preventDefault();
        try {
            setPending(true);
            await onConfirm();
            onOpenChange(false);
        }
        finally {
            setPending(false);
        }
    };
    return (_jsx(AlertDialog, { open: open, onOpenChange: (next) => !pending && onOpenChange(next), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsxs(AlertDialogTitle, { className: "flex items-center gap-2", children: [icon, _jsx("span", { children: title })] }), description && (_jsx(AlertDialogDescription, { children: description }))] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { disabled: pending, children: cancelText }), _jsx(AlertDialogAction, { onClick: handleConfirm, disabled: pending, className: cn(variant === "destructive" &&
                                buttonVariants({ variant: "destructive" })), children: pending ? `${confirmText}\u2026` : confirmText })] })] }) }));
}
//# sourceMappingURL=confirm-dialog.js.map