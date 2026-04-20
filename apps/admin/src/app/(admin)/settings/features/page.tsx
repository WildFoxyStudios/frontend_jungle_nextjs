"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function FeaturesPage() {
  return (
    <AdminPageShell
      title="Feature toggles"
      description="Enable or disable platform-wide features. Disabled features are hidden from users and their APIs return 403."
    >
      <CatalogSettingsForm category="features" />
    </AdminPageShell>
  );
}
