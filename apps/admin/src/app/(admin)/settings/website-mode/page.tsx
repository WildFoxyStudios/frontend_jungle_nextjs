"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function WebsiteModeSettingsPage() {
  return (
    <AdminPageShell
      title="Website mode"
      description="Pick the primary vertical the site optimises for (social, jobs, marketplace, forum, dating, media) and the landing route each mode uses."
    >
      <CatalogSettingsForm category="website_mode" />
    </AdminPageShell>
  );
}
