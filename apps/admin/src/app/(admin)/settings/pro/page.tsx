"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function ProSettingsPage() {
  return (
    <AdminPageShell
      title="Pro subscriptions"
      description="Trial period, grace window, auto-renew behaviour, and storage quotas for Pro members."
    >
      <CatalogSettingsForm category="pro" />
    </AdminPageShell>
  );
}
