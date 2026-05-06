"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border px-2 py-0.5",
    "text-[0.7rem] font-semibold tracking-wide leading-tight",
    "shadow-xs transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        success: "bg-success text-success-foreground",
        warning: "bg-warning text-warning-foreground",
        info: "bg-info text-info-foreground",
        accent: "bg-accent text-accent-foreground",
        outline: "bg-card text-foreground",
        // ── Soft (tonal) badges — premium, less aggressive ──
        "soft-primary": "bg-primary-soft text-primary border-primary/40",
        "soft-secondary":
          "bg-secondary-soft text-secondary-foreground border-secondary/50",
        "soft-accent": "bg-accent-soft text-accent border-accent/40",
        "soft-success": "bg-success-soft text-success border-success/40",
        "soft-warning":
          "bg-warning-soft text-warning-foreground border-warning/50",
        "soft-info": "bg-info-soft text-info border-info/40",
        "soft-destructive":
          "bg-destructive-soft text-destructive border-destructive/40",
        ghost:
          "border-transparent bg-transparent text-foreground shadow-none",
      },
      size: {
        sm: "px-1.5 py-0 text-[0.65rem]",
        default: "px-2 py-0.5 text-[0.7rem]",
        lg: "px-3 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
