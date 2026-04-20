"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function SocialLoginSettingsPage() {
  return (
    <AdminPageShell
      title="Social login"
      description="OAuth/OpenID Connect providers. Enable each provider, then fill in its client ID + secret. Callback URL is /api/v1/auth/oauth/{provider}/callback."
    >
      <CatalogSettingsForm category="social_login" />
    </AdminPageShell>
  );
}
