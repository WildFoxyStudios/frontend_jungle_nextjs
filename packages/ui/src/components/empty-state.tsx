"use client";

import * as React from "react";
import { cn } from "../lib/utils";

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center justify-center gap-3 border bg-card p-8 text-center shadow-sm",
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="grid h-12 w-12 place-items-center border bg-secondary text-secondary-foreground shadow-xs">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-extrabold leading-tight tracking-tight">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
