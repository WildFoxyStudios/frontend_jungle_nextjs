"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const containerSize = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-none",
} as const;

export function PageContainer({
  size = "lg",
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 py-4 sm:py-6",
        containerSize[size],
        className
      )}
      {...props}
    />
  );
}

/** Alias for `PageContainer` (semantic name for “main content width” in layouts). */
export const ContentFrame = PageContainer;

export interface PageSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  bare?: boolean;
}

export function PageSection({
  title,
  description,
  actions,
  bare,
  className,
  children,
  ...props
}: PageSectionProps) {
  return (
    <section
      className={cn(
        "mb-6",
        !bare && "border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      {(title || description || actions) && (
        <header
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
            !bare && "border-b bg-muted px-4 py-3 sm:px-6"
          )}
        >
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight truncate">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn(!bare && "p-4 sm:p-6")}>{children}</div>
    </section>
  );
}

export interface ResponsiveStackProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?: "xs" | "sm" | "md" | "lg" | "xl";
  direction?: "row" | "col";
  align?: "start" | "center" | "end" | "stretch";
}

const gapSize = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

export function ResponsiveStack({
  gap = "md",
  direction = "row",
  align = "stretch",
  className,
  ...props
}: ResponsiveStackProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap",
        direction === "col" ? "flex-col" : "flex-row",
        align === "center" && "items-center",
        align === "start" && "items-start",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        gapSize[gap],
        className
      )}
      {...props}
    />
  );
}
