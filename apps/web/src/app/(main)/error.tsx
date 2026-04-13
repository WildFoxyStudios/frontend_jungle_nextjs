"use client";

import { useEffect } from "react";
import { Button } from "@jungle/ui";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          This page encountered an error. You can try again or go back to the feed.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" asChild className="gap-2">
          <Link href="/feed">
            <Home className="h-4 w-4" /> Go to feed
          </Link>
        </Button>
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
