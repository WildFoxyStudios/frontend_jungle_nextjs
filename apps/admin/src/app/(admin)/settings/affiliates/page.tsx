"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function AffiliatesSettingsPage() {
  return (
    <AdminPageShell
      title="Affiliates"
      description="Commission rate, minimum payout, payout cycle and cookie TTL for the referral/affiliate program."
    >
      <CatalogSettingsForm category="affiliates" />
    </AdminPageShell>
  );
}
