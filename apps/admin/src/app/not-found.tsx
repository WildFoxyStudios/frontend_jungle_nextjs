import Link from "next/link";
import { Button } from "@jungle/ui";
import { FileQuestion, LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="rounded-full bg-muted p-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-5xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground">This admin page doesn't exist</p>
      </div>
      <Button asChild className="gap-2">
        <Link href="/"><LayoutDashboard className="h-4 w-4" /> Back to Dashboard</Link>
      </Button>
    </div>
  );
}
