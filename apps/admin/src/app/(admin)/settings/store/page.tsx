"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function StoreSettingsPage() {
  return (
    <AdminPageShell
      title="Marketplace / store"
      description="Platform commission, tax, shipping-zones JSON, auto-approval, and featured product IDs."
    >
      <CatalogSettingsForm category="store" />
    </AdminPageShell>
  );
}
