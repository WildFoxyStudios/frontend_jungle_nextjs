"use client";

import { useEffect } from "react";
import { Button } from "@jungle/ui";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>
      <Button onClick={reset} className="gap-2">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
