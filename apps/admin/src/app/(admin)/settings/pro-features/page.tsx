"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

/**
 * Plan §3.22.3 — migrated from a hard-coded field list to the
 * catalog-driven form. Field definitions live in
 * `backend/crates/admin-service/src/handlers/config_catalog.rs`
 * under the `pro_features` category.
 */
export default function ProFeaturesSettingsPage() {
  return (
    <AdminPageShell title="Pro Features">
      <CatalogSettingsForm category="pro_features" title="Pro membership features" />
    </AdminPageShell>
  );
}
