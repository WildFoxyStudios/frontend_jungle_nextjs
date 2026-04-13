"use client";

import { useEffect } from "react";
import { Button } from "@jungle/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This page encountered an error. Please try again.
        </p>
      </div>
      <Button onClick={reset} className="gap-2">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
