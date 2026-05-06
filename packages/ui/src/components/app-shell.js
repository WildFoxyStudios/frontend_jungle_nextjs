"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from "../lib/utils";
/**
 * Generic responsive AppShell:
 * sidebar (collapsible/desktop-only) | content (with topbar) | rightRail (lg+)
 *
 * - On mobile: `topbar` + content; optional `bottomNav` when the app passes it.
 * - On md+: sidebar appears.
 * - On lg+: rightRail appears (when provided).
 *
 * Layout-only — does not impose any visual chrome on its children.
 */
export function AppShell({ sidebar, rightRail, topbar, bottomNav, overlays, className, children, ...props }) {
    return (_jsxs("div", { className: cn("flex h-screen w-full min-w-0 max-w-full overflow-hidden text-foreground", className), ...props, children: [sidebar ? (_jsx("div", { className: "hidden md:block shrink-0", children: sidebar })) : null, _jsxs("div", { className: "flex flex-1 flex-col min-w-0", children: [topbar ? _jsx("div", { className: "shrink-0", children: topbar }) : null, _jsxs("div", { className: "flex flex-1 min-h-0", children: [_jsx("main", { id: "main-content", tabIndex: -1, className: cn("flex-1 min-w-0 overflow-y-auto scrollbar-thin", bottomNav && "pb-20 md:pb-0"), children: children }), rightRail ? (_jsx("div", { className: "hidden h-full min-h-0 shrink-0 lg:flex lg:flex-col", children: rightRail })) : null] })] }), bottomNav ? (_jsx("div", { className: "md:hidden", children: bottomNav })) : null, overlays] }));
}
const sidebarWidth = {
    sm: "w-56",
    md: "w-64",
    lg: "w-72",
};
export function SidebarShell({ width = "md", className, ...props }) {
    return (_jsx("aside", { className: cn("h-full overflow-y-auto scrollbar-thin", sidebarWidth[width], className), ...props }));
}
export function TopbarShell({ className, ...props }) {
    return (_jsx("header", { className: cn("sticky top-0 z-50 border-b border-border pt-safe", 
        // Glass hybrid topbar.
        "bg-card/85 supports-[backdrop-filter]:bg-card/60", "backdrop-blur-xl backdrop-saturate-150", "shadow-elevated-sm", className), role: "banner", ...props }));
}
export function BottomNavShell({ className, ...props }) {
    return (_jsx("nav", { className: cn("fixed bottom-0 inset-x-0 z-50 border-t border-border pb-safe md:hidden h-14", 
        // Glass treatment for bottom nav too.
        "bg-card/90 supports-[backdrop-filter]:bg-card/72", "backdrop-blur-xl backdrop-saturate-150", "shadow-elevated-md", className), role: "navigation", ...props }));
}
//# sourceMappingURL=app-shell.js.map