"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

/**
 * Plan §3.22.3 — migrated from a hard-coded field list to the
 * catalog-driven form. Field definitions live in
 * `backend/crates/admin-service/src/handlers/config_catalog.rs`
 * under the `auth` category.
 */
export default function AuthSettingsPage() {
  return (
    <AdminPageShell title="Auth Settings">
      <CatalogSettingsForm category="auth" title="Authentication configuration" />
    </AdminPageShell>
  );
}
