"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[96px] w-full border bg-input px-3 py-2 text-sm font-medium",
          "shadow-sm transition-all duration-100",
          "placeholder:text-muted-foreground placeholder:font-normal",
          "focus-visible:outline-none focus-visible:shadow-md focus-visible:border-primary",
          "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
