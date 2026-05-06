"use client";

import { cn } from "../lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-lg bg-surface-sunken skeleton-shimmer animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
