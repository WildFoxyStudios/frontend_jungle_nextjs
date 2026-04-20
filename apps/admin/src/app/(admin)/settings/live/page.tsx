"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function LiveSettingsPage() {
  return (
    <AdminPageShell
      title="Live streaming"
      description="Pick the provider (RTMP ingest, Agora, or Millicast) and configure concurrency caps and recording."
    >
      <CatalogSettingsForm category="live" />
    </AdminPageShell>
  );
}
