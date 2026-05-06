import * as React from "react";
export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
    sidebar?: React.ReactNode;
    rightRail?: React.ReactNode;
    topbar?: React.ReactNode;
    bottomNav?: React.ReactNode;
    overlays?: React.ReactNode;
}
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
export declare function AppShell({ sidebar, rightRail, topbar, bottomNav, overlays, className, children, ...props }: AppShellProps): import("react/jsx-runtime").JSX.Element;
export interface SidebarShellProps extends React.HTMLAttributes<HTMLElement> {
    width?: "sm" | "md" | "lg";
}
export declare function SidebarShell({ width, className, ...props }: SidebarShellProps): import("react/jsx-runtime").JSX.Element;
export interface TopbarShellProps extends React.HTMLAttributes<HTMLElement> {
}
export declare function TopbarShell({ className, ...props }: TopbarShellProps): import("react/jsx-runtime").JSX.Element;
export interface BottomNavShellProps extends React.HTMLAttributes<HTMLElement> {
}
export declare function BottomNavShell({ className, ...props }: BottomNavShellProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=app-shell.d.ts.map