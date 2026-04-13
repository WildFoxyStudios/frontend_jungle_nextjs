"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "affiliate_system_enabled", label: "Enable Affiliate System", type: "boolean" as const },
  { key: "affiliate_type", label: "Affiliate Type", type: "select" as const, options: ["registration", "purchase", "both"] },
  { key: "affiliate_commission", label: "Affiliate Commission (%)", type: "number" as const },
  { key: "affiliate_min_payout", label: "Minimum Payout Amount", type: "number" as const },
  { key: "affiliate_cookie_days", label: "Cookie Duration (days)", type: "number" as const },
  { key: "referral_points", label: "Points per Referral", type: "number" as const },
];

export default function AffiliatesSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "affiliates"], queryFn: () => adminApi.getConfigCategory("affiliates") });
  return (
    <AdminPageShell title="Affiliates Settings">
      <SettingsForm title="Affiliate & Referral System" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("affiliates", v)} />
    </AdminPageShell>
  );
}
