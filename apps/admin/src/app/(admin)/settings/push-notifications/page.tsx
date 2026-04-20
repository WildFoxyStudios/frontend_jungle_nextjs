"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function PushNotificationsSettingsPage() {
  return (
    <AdminPageShell
      title="Push notifications"
      description="FCM (Android), APNs (iOS), and Web Push (VAPID) credentials. Each platform can be configured independently."
    >
      <CatalogSettingsForm category="push" />
    </AdminPageShell>
  );
}
