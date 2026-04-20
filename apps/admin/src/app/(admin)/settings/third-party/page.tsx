"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function ThirdPartySettingsPage() {
  return (
    <AdminPageShell
      title="Third-party integrations"
      description="Analytics pixels (GA4, GTM, Facebook Pixel, Hotjar), chat widgets, error tracking, reCAPTCHA, GIF and map API keys."
    >
      <CatalogSettingsForm category="third_party" />
    </AdminPageShell>
  );
}
