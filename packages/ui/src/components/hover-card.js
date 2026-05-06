"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "../lib/utils";
const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
const HoverCardContent = React.forwardRef(({ className, align = "center", sideOffset = 6, ...props }, ref) => (_jsx(HoverCardPrimitive.Portal, { children: _jsx(HoverCardPrimitive.Content, { ref: ref, align: align, sideOffset: sideOffset, className: cn("z-50 w-64 p-4 text-popover-foreground outline-none", "neo-glass-strong shadow-elevated-md", "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95", className), ...props }) })));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;
export { HoverCard, HoverCardTrigger, HoverCardContent };
//# sourceMappingURL=hover-card.js.map