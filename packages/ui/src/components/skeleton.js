"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../lib/utils";
function Skeleton({ className, ...props }) {
    return (_jsx("div", { className: cn("animate-shimmer rounded-lg bg-surface-sunken skeleton-shimmer animate-pulse", className), ...props }));
}
export { Skeleton };
//# sourceMappingURL=skeleton.js.map