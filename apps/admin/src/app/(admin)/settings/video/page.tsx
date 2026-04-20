"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function VideoSettingsPage() {
  return (
    <AdminPageShell
      title="Video upload settings"
      description="Max size, duration, formats, watermarking, and autoplay behaviour."
    >
      <CatalogSettingsForm category="video" />
    </AdminPageShell>
  );
}
