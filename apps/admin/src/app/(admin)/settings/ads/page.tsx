"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function AdsSettingsPage() {
  return (
    <AdminPageShell
      title="Ads settings"
      description="User self-serve ads platform. Configure review mode, budgets, default CPC/CPM rates, formats, and keyword blocklist."
    >
      <CatalogSettingsForm category="ads" />
    </AdminPageShell>
  );
}
