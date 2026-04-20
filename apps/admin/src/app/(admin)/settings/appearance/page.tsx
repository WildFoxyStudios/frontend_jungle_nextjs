"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function AppearanceSettingsPage() {
  return (
    <AdminPageShell
      title="Appearance & branding"
      description="Brand colours, logo, favicon, dark-mode default, hero background, and custom CSS."
    >
      <CatalogSettingsForm category="appearance" />
    </AdminPageShell>
  );
}
