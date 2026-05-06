"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;
const SheetOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Overlay, { className: cn("fixed inset-0 z-[9999] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className), ...props, ref: ref })));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;
const sheetVariants = cva([
    "fixed z-[10000] gap-4 p-4 sm:p-6 rounded-xl",
    "glass-blur-strong shadow-lg",
    "transition ease-in-out",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:duration-200 data-[state=open]:duration-300",
].join(" "), {
    variants: {
        side: {
            top: "inset-x-0 top-0 border-x-0 border-t-0 border-b border-border data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top pt-safe",
            bottom: "inset-x-0 bottom-0 border-x-0 border-b-0 border-t border-border data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom pb-safe",
            left: "inset-y-0 left-0 h-dvh w-[85%] sm:w-3/4 sm:max-w-sm border-y-0 border-l-0 border-r border-border data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            right: "inset-y-0 right-0 h-dvh w-[85%] sm:w-3/4 sm:max-w-sm border-y-0 border-r-0 border-l border-border data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
        },
    },
    defaultVariants: { side: "right" },
});
const SheetContent = React.forwardRef(({ side = "right", className, children, "aria-describedby": ariaDescribedBy, ...props }, ref) => (_jsxs(SheetPortal, { children: [_jsx(SheetOverlay, {}), _jsxs(SheetPrimitive.Content, { ref: ref, className: cn(sheetVariants({ side }), className), ...props, "aria-describedby": ariaDescribedBy, children: [ariaDescribedBy === undefined ? (_jsx(SheetPrimitive.Description, { className: "sr-only", children: "Panel" })) : null, children, _jsxs(SheetPrimitive.Close, { className: cn("absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-sm border bg-card", "shadow-sm transition-all hover:bg-destructive hover:text-destructive-foreground hover:-translate-y-px hover:shadow-md", "active:translate-y-0 active:shadow-none", "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"), children: [_jsx(X, { className: "h-4 w-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] })));
SheetContent.displayName = SheetPrimitive.Content.displayName;
const SheetHeader = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col space-y-1.5 text-left", className), ...props }));
SheetHeader.displayName = "SheetHeader";
const SheetFooter = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className), ...props }));
SheetFooter.displayName = "SheetFooter";
const SheetTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Title, { ref: ref, className: cn("text-xl font-extrabold leading-tight tracking-tight text-foreground", className), ...props })));
SheetTitle.displayName = SheetPrimitive.Title.displayName;
const SheetDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(SheetPrimitive.Description, { ref: ref, className: cn("text-sm text-muted-foreground", className), ...props })));
SheetDescription.displayName = SheetPrimitive.Description.displayName;
export { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, };
//# sourceMappingURL=sheet.js.map