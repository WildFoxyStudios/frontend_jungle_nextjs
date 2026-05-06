import Link from "next/link";
import { Button } from "@jungle/ui";
import { LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="border bg-secondary px-6 py-3 shadow-md">
        <p className="text-6xl font-black tracking-tight text-secondary-foreground">404</p>
      </div>
      <p className="max-w-md text-lg font-bold text-foreground">
        This admin page doesn&apos;t exist
      </p>
      <Button asChild>
        <Link href="/">
          <LayoutDashboard className="h-4 w-4" /> Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
