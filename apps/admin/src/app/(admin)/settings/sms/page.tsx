"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function SmsSettingsPage() {
  return (
    <AdminPageShell
      title="SMS settings"
      description="Outbound SMS transport for phone verification and notifications. Supports Twilio, Infobip, and MSG91."
    >
      <CatalogSettingsForm category="sms" />
    </AdminPageShell>
  );
}
