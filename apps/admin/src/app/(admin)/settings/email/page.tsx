"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";
import { TestEmailButton } from "@/components/admin/TestEmailButton";

export default function EmailSettingsPage() {
  return (
    <AdminPageShell
      title="Email / SMTP settings"
      description="Outbound email transport. Supports SMTP, SendGrid, Mailgun, AWS SES, and Postmark."
    >
      <CatalogSettingsForm category="email" />
      <TestEmailButton />
    </AdminPageShell>
  );
}
