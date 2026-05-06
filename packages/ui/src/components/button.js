"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../lib/utils";
const buttonVariants = cva([
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-sm border font-semibold tracking-wide",
    "shadow-sm transition-all duration-fast ease-out",
    "hover:-translate-y-px hover:shadow-md",
    "active:translate-y-0 active:shadow-xs",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
].join(" "), {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground",
            destructive: "bg-destructive text-destructive-foreground",
            outline: "bg-card text-foreground",
            secondary: "bg-secondary text-secondary-foreground",
            accent: "bg-accent text-accent-foreground",
            success: "bg-success text-success-foreground",
            warning: "bg-warning text-warning-foreground",
            info: "bg-info text-info-foreground",
            // ── Soft (tonal) variants — premium, low-saturation feel ─────
            "soft-primary": "bg-primary-soft text-primary border-primary/40 shadow-sm hover:shadow-md",
            "soft-secondary": "bg-secondary-soft text-secondary-foreground border-secondary/50 shadow-sm hover:shadow-md",
            "soft-accent": "bg-accent-soft text-accent border-accent/40 shadow-sm hover:shadow-md",
            "soft-success": "bg-success-soft text-success border-success/40 shadow-sm hover:shadow-md",
            "soft-warning": "bg-warning-soft text-warning-foreground border-warning/50 shadow-sm hover:shadow-md",
            "soft-info": "bg-info-soft text-info border-info/40 shadow-sm hover:shadow-md",
            "soft-destructive": "bg-destructive-soft text-destructive border-destructive/40 shadow-sm hover:shadow-md",
            // ── Glass variant — for floating actions over images/video ──
            glass: [
                "glass-blur text-foreground",
                "shadow-sm hover:shadow-md",
                "hover:-translate-y-px",
                "active:translate-y-0 active:shadow-xs",
            ].join(" "),
            ghost: "border-transparent bg-transparent text-foreground shadow-none hover:bg-muted hover:shadow-none hover:translate-y-0",
            link: "border-transparent bg-transparent text-primary underline underline-offset-4 shadow-none hover:shadow-none hover:translate-y-0 hover:no-underline",
        },
        size: {
            default: "h-10 px-4 text-sm",
            sm: "h-9 px-3 text-xs",
            lg: "h-12 px-6 text-base rounded-md",
            xl: "h-14 px-8 text-lg rounded-md",
            icon: "h-10 w-10",
            "icon-sm": "h-9 w-9",
            // ── Touch-friendly (44×44 iOS guideline) ─────────────────────
            touch: "h-11 min-w-[2.75rem] px-4 text-sm",
            "touch-icon": "h-11 w-11",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "default",
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (_jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref: ref, ...props }));
});
Button.displayName = "Button";
export { Button, buttonVariants };
//# sourceMappingURL=button.js.map