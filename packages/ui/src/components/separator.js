"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../lib/utils";
const Separator = React.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (_jsx(SeparatorPrimitive.Root, { ref: ref, decorative: decorative, orientation: orientation, className: cn("shrink-0 bg-foreground", orientation === "horizontal" ? "h-[2px] w-full" : "h-full w-[2px]", className), ...props })));
Separator.displayName = SeparatorPrimitive.Root.displayName;
export { Separator };
//# sourceMappingURL=separator.js.map