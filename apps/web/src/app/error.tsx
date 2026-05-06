"use client";

import { useEffect } from "react";
import { Button, ErrorState } from "@jungle/ui";
import { RotateCcw } from "lucide-react";

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
 <div className="flex min-h-svh items-center justify-center bg-background px-4 py-12">
 <ErrorState
 title="Something went wrong"
 description="An unexpected error occurred. Try again, and if the problem keeps happening contact support."
 action={
 <Button onClick={reset} variant="outline">
 <RotateCcw className="h-4 w-4" /> Try again
 </Button>
 }
 />
 </div>
 );
}
