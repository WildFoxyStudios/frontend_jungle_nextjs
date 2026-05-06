"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../lib/utils";
const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (_jsx("input", { type: type, className: cn("flex h-10 w-full rounded-md border bg-input px-3 py-2 text-sm font-medium", "shadow-sm transition-all duration-fast", "file:border-0 file:bg-transparent file:text-sm file:font-semibold", "placeholder:text-muted-foreground placeholder:font-normal", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary", "focus:ring-2 focus:ring-primary/50 focus:border-primary", "aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive", "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none", className), ref: ref, ...props }));
});
Input.displayName = "Input";
export { Input };
//# sourceMappingURL=input.js.map