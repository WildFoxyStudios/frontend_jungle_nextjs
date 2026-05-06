"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "../lib/utils";
import { buttonVariants } from "./button";
const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Overlay, { className: cn("fixed inset-0 z-[9999] bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0", className), style: { zIndex: 9999 }, ...props, ref: ref })));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
const AlertDialogContent = React.forwardRef(({ className, style, ...props }, ref) => (_jsxs(AlertDialogPortal, { children: [_jsx(AlertDialogOverlay, {}), _jsx(AlertDialogPrimitive.Content, { ref: ref, className: cn("fixed z-[10000] grid w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] overflow-y-auto gap-4 p-4 sm:p-6 duration-200", "border bg-popover text-popover-foreground shadow-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className), style: {
                zIndex: 10000,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                ...style,
            }, ...props })] })));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
const AlertDialogHeader = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col space-y-1.5 text-left", className), ...props }));
AlertDialogHeader.displayName = "AlertDialogHeader";
const AlertDialogFooter = ({ className, ...props }) => (_jsx("div", { className: cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3", className), ...props }));
AlertDialogFooter.displayName = "AlertDialogFooter";
const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Title, { ref: ref, className: cn("text-xl font-extrabold leading-tight tracking-tight", className), ...props })));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Description, { ref: ref, className: cn("text-sm text-muted-foreground", className), ...props })));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Action, { ref: ref, className: cn(buttonVariants(), className), ...props })));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (_jsx(AlertDialogPrimitive.Cancel, { ref: ref, className: cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className), ...props })));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;
export { AlertDialog, AlertDialogPortal, AlertDialogOverlay, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, };
//# sourceMappingURL=alert-dialog.js.map