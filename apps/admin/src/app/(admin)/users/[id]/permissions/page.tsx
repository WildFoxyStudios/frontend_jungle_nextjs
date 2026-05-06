"use client";

import { use } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PermissionsEditor } from "./PermissionsEditor";

/**
 * Plan §3.22 AP-A1 — granular per-user admin permissions matrix.
 *
 * Backend persists the JSONB payload at `users.permissions`
 * (migration 20260422000013).
 */
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const userId = Number(id);
  if (!Number.isFinite(userId)) {
    return (
      <AdminPageShell title="Permissions">
        <p className="text-destructive">Invalid user id.</p>
      </AdminPageShell>
    );
  }
  return (
    <AdminPageShell title="Permissions">
      <PermissionsEditor userId={userId} />
    </AdminPageShell>
  );
}
