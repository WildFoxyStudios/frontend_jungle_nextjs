"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
const cardVariants = cva("rounded-lg border bg-card text-card-foreground transition-shadow duration-fast", {
    variants: {
        variant: {
            default: "shadow-sm",
            flat: "shadow-none",
            raised: "shadow-md",
            // ── elevated uses real drop shadows (premium feel) ──
            elevated: "shadow-md",
            // ── glass card for image overlays / floating UI ──
            glass: "glass-blur shadow-sm border-border/85",
            ghost: "border-transparent shadow-none",
        },
        interactive: {
            true: "cursor-pointer transition-shadow duration-fast hover:shadow-md",
            false: "",
        },
    },
    defaultVariants: {
        variant: "default",
        interactive: false,
    },
});
const Card = React.forwardRef(({ className, variant, interactive, onClick, onKeyDown, ...props }, ref) => {
    const handleKeyDown = interactive
        ? (e) => {
            if (onKeyDown)
                onKeyDown(e);
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e);
            }
        }
        : onKeyDown;
    return (_jsx("div", { ref: ref, role: interactive ? "button" : undefined, tabIndex: interactive ? 0 : undefined, className: cn(cardVariants({ variant, interactive }), className), onClick: onClick, onKeyDown: handleKeyDown, ...props }));
});
Card.displayName = "Card";
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex flex-col space-y-1.5 p-4 sm:p-6", className), ...props })));
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (_jsx("h3", { ref: ref, className: cn("text-xl sm:text-2xl font-extrabold leading-tight tracking-tight", className), ...props })));
CardTitle.displayName = "CardTitle";
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("p", { ref: ref, className: cn("text-sm text-muted-foreground", className), ...props })));
CardDescription.displayName = "CardDescription";
const CardContent = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("p-4 pt-0 sm:p-6 sm:pt-0", className), ...props })));
CardContent.displayName = "CardContent";
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("flex items-center p-4 pt-0 sm:p-6 sm:pt-0", className), ...props })));
CardFooter.displayName = "CardFooter";
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants, };
//# sourceMappingURL=card.js.map