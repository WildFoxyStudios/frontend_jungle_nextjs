"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function LiveSettingsPage() {
  return (
    <AdminPageShell
      title="Live streaming"
      description="Configure self-hosted WebRTC signaling, STUN/TURN, and provider fallbacks for live streams, audio calls, and video calls."
    >
      <CatalogSettingsForm category="live" />
    </AdminPageShell>
  );
}
