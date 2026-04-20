"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function CustomCodeSettingsPage() {
  return (
    <AdminPageShell
      title="Custom code"
      description="Inject HTML / JS into the <head>, before </body>, or a global JS snippet. Useful for analytics, chat widgets, verification tags, and preloaded assets."
    >
      <CatalogSettingsForm category="custom_code" />
    </AdminPageShell>
  );
}
