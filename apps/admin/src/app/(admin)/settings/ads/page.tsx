"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "user_ads_enabled", label: "Enable User Ads System", type: "boolean" as const },
  { key: "ads_min_budget", label: "Minimum Ad Budget", type: "number" as const },
  { key: "ads_currency", label: "Ads Currency", type: "text" as const, placeholder: "USD" },
  { key: "ads_cpc_rate", label: "CPC Rate (cost per click)", type: "number" as const },
  { key: "ads_cpm_rate", label: "CPM Rate (cost per 1000 impressions)", type: "number" as const },
  { key: "ads_require_approval", label: "Require Admin Approval for Ads", type: "boolean" as const },
  { key: "ads_target_countries", label: "Allowed Target Countries (comma-separated ISO codes)", type: "text" as const, placeholder: "US,GB,CA,AU" },
  { key: "ads_placements", label: "Ad Placements (comma-separated)", type: "text" as const, placeholder: "feed,sidebar,story" },
];

export default function AdsSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "ads"], queryFn: () => adminApi.getConfigCategory("ads") });
  return (
    <AdminPageShell title="Ads Settings">
      <SettingsForm title="User Advertising System" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("ads", v)} />
    </AdminPageShell>
  );
}
