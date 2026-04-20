"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function EmailSecuritySettingsPage() {
  return (
    <AdminPageShell
      title="Email security"
      description="Blocklists, disposable-domain filtering, and SPF enforcement. Applied at registration and when users change their email."
    >
      <CatalogSettingsForm category="email_security" />
    </AdminPageShell>
  );
}
