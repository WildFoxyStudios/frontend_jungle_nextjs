"use client";

import * as React from "react";
import { cn } from "../lib/utils";

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
export function AppShell({
  sidebar,
  rightRail,
  topbar,
  bottomNav,
  overlays,
  className,
  children,
  ...props
}: AppShellProps) {
  return (
    <div
      className={cn(
        "flex h-screen w-full min-w-0 max-w-full overflow-hidden text-foreground",
        className
      )}
      {...props}
    >
      {sidebar ? (
        <div className="hidden md:block shrink-0">{sidebar}</div>
      ) : null}

      <div className="flex flex-1 flex-col min-w-0">
        {topbar ? <div className="shrink-0">{topbar}</div> : null}
        <div className="flex flex-1 min-h-0">
          <main
            id="main-content"
            tabIndex={-1}
            className={cn(
              "flex-1 min-w-0 overflow-y-auto scrollbar-thin",
              bottomNav && "pb-20 md:pb-0"
            )}
          >
            {children}
          </main>
          {rightRail ? (
            <div className="hidden h-full min-h-0 shrink-0 lg:flex lg:flex-col">{rightRail}</div>
          ) : null}
        </div>
      </div>

      {bottomNav ? (
        <div className="md:hidden">{bottomNav}</div>
      ) : null}
      {overlays}
    </div>
  );
}

export interface SidebarShellProps extends React.HTMLAttributes<HTMLElement> {
  width?: "sm" | "md" | "lg";
}

const sidebarWidth = {
  sm: "w-56",
  md: "w-64",
  lg: "w-72",
} as const;

export function SidebarShell({ width = "md", className, ...props }: SidebarShellProps) {
  return (
    <aside
      className={cn(
        "h-full overflow-y-auto scrollbar-thin",
        sidebarWidth[width],
        className
      )}
      {...props}
    />
  );
}

export interface TopbarShellProps extends React.HTMLAttributes<HTMLElement> {}

export function TopbarShell({ className, ...props }: TopbarShellProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border pt-safe",
        // Glass hybrid topbar.
        "bg-card/85 supports-[backdrop-filter]:bg-card/60",
        "backdrop-blur-xl backdrop-saturate-150",
        "shadow-elevated-sm",
        className
      )}
      role="banner"
      {...props}
    />
  );
}

export interface BottomNavShellProps extends React.HTMLAttributes<HTMLElement> {}

export function BottomNavShell({ className, ...props }: BottomNavShellProps) {
  return (
    <nav
      className={cn(
        "fixed bottom-0 inset-x-0 z-50 border-t border-border pb-safe md:hidden h-14",
        // Glass treatment for bottom nav too.
        "bg-card/90 supports-[backdrop-filter]:bg-card/72",
        "backdrop-blur-xl backdrop-saturate-150",
        "shadow-elevated-md",
        className
      )}
      role="navigation"
      {...props}
    />
  );
}
