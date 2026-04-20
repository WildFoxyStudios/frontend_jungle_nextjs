"use client";

import Link from "next/link";
import { History } from "lucide-react";
import { Button } from "@jungle/ui";

interface AuditLogLinkProps {
  /** Filter the audit log by target resource (maps to activity_log.target_type). */
  resource?: string;
  /** Optional specific target id (activity_log.target_id). */
  targetId?: number | string;
  label?: string;
  /** Visual style. */
  variant?: "ghost" | "outline";
}

/**
 * Small "View audit log" button placed next to destructive actions
 * (deletes, force-ends, role changes) so admins can jump straight to the
 * activity log filtered to the relevant resource.
 *
 * Links into `/system/activity-log?target_type=<resource>&target_id=<id>`.
 * The activity-log page reads those query params to seed its filters.
 */
export function AuditLogLink({ resource, targetId, label = "View audit log", variant = "ghost" }: AuditLogLinkProps) {
  const params = new URLSearchParams();
  if (resource) params.set("target_type", resource);
  if (targetId !== undefined) params.set("target_id", String(targetId));
  const href = params.toString()
    ? `/system/activity-log?${params.toString()}`
    : "/system/activity-log";

  return (
    <Button asChild variant={variant} size="sm" className="gap-1.5 text-xs">
      <Link href={href}>
        <History className="h-3.5 w-3.5" />
        {label}
      </Link>
    </Button>
  );
}
