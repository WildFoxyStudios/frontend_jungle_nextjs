"use client";

import { useEffect } from "react";
import { Button, ErrorState } from "@jungle/ui";
import { RotateCcw } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center px-4 py-12">
      <ErrorState
        title="Something went wrong"
        description="This admin page hit an error. Try again or refresh."
        action={
          <Button onClick={reset} variant="outline">
            <RotateCcw className="h-4 w-4" /> Try again
          </Button>
        }
      />
    </div>
  );
}
