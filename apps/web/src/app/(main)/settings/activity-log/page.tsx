"use client";

import { EmptyState } from "@jungle/ui";
import { History } from "lucide-react";

export default function ActivityLogPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<History className="h-10 w-10" />}
        title="Activity Log"
        description="Your account activity will appear here. Check back soon."
      />
    </div>
  );
}
