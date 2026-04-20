"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function GeneralSettingsPage() {
  return (
    <AdminPageShell
      title="General settings"
      description="Core site identity, locale, registration rules, and availability."
    >
      <CatalogSettingsForm category="general" />
    </AdminPageShell>
  );
}
