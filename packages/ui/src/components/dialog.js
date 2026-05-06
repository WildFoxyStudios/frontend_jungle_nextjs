"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Overlay, { ref: ref, className: cn("fixed inset-0 z-[9999] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className), style: { zIndex: 9999 }, ...props })));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, "aria-describedby": ariaDescribedBy, style, ...props }, ref) => (_jsxs(DialogPortal, { children: [_jsx(DialogOverlay, {}), _jsxs(DialogPrimitive.Content, { ref: ref, className: cn("fixed z-[10000] grid w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto gap-4 rounded-xl", "border bg-popover text-popover-foreground p-4 sm:p-6 shadow-lg duration-slow", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className), style: {
                zIndex: 10000,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                ...style,
            }, ...props, "aria-describedby": ariaDescribedBy, children: [ariaDescribedBy === undefined ? (_jsx(DialogPrimitive.Description, { className: "sr-only", children: "Dialog" })) : null, children, _jsxs(DialogPrimitive.Close, { className: cn("absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-sm border bg-card", "shadow-sm hover:bg-destructive hover:text-destructive-foreground", "transition-all hover:-translate-y-px hover:shadow-md", "active:translate-y-0 active:shadow-none", "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"), children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] })));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col space-y-1.5 text-left", className), ...props }));
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className), ...props }));
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Title, { ref: ref, className: cn("text-xl font-extrabold leading-tight tracking-tight", className), ...props })));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(DialogPrimitive.Description, { ref: ref, className: cn("text-sm text-muted-foreground", className), ...props })));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
export { Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, };
//# sourceMappingURL=dialog.js.map