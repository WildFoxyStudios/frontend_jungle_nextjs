"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
const alertVariants = cva("relative w-full rounded-md border p-4 shadow-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4", {
    variants: {
        variant: {
            default: "bg-card text-foreground [&>svg]:text-foreground",
            info: "bg-info-soft text-info border-info/40 [&>svg]:text-info",
            success: "bg-success-soft text-success border-success/40 [&>svg]:text-success",
            warning: "bg-warning-soft text-warning-foreground border-warning/50 [&>svg]:text-warning",
            destructive: "bg-destructive-soft text-destructive border-destructive/40 [&>svg]:text-destructive",
        },
    },
    defaultVariants: { variant: "default" },
});
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (_jsx("div", { ref: ref, role: "alert", className: cn(alertVariants({ variant }), className), ...props })));
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h5", { ref: ref, className: cn("mb-1 font-extrabold leading-tight tracking-tight", className), ...props })));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props })));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertTitle, AlertDescription };
//# sourceMappingURL=alert.js.map