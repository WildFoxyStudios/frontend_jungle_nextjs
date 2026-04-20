"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function SeoSettingsPage() {
  return (
    <AdminPageShell
      title="SEO settings"
      description="Meta title suffix, default description, open-graph image, Twitter card, search-engine verification tokens, and sitemap/robots behaviour."
    >
      <CatalogSettingsForm category="seo" />
    </AdminPageShell>
  );
}
