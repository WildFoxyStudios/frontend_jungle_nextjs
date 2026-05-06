"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "../lib/utils";

export interface ErrorStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function ErrorState({
  title = "Something broke",
  description = "An unexpected error happened. Try again or refresh the page.",
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-md flex-col items-center justify-center gap-3 border bg-destructive p-6 text-center text-destructive-foreground shadow-md",
        className
      )}
      {...props}
    >
      <div className="grid h-12 w-12 place-items-center border bg-card text-foreground shadow-xs">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-extrabold uppercase leading-tight tracking-tight">{title}</h3>
      {description ? (
        <p className="text-sm font-medium opacity-95">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
