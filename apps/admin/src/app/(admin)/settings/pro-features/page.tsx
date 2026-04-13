"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "pro_enabled", label: "Enable Pro Membership System", type: "boolean" as const },
  { key: "pro_boost_posts", label: "Boost Posts (Pro only)", type: "boolean" as const },
  { key: "pro_boost_pages", label: "Boost Pages (Pro only)", type: "boolean" as const },
  { key: "pro_verified_badge", label: "Verified Badge (Pro only)", type: "boolean" as const },
  { key: "pro_live_streaming", label: "Live Streaming (Pro only)", type: "boolean" as const },
  { key: "pro_video_calls", label: "Video Calls (Pro only)", type: "boolean" as const },
  { key: "pro_no_ads", label: "No Ads (Pro only)", type: "boolean" as const },
  { key: "pro_unlimited_uploads", label: "Unlimited Uploads (Pro only)", type: "boolean" as const },
  { key: "pro_analytics", label: "Advanced Analytics (Pro only)", type: "boolean" as const },
  { key: "pro_custom_profile", label: "Custom Profile Design (Pro only)", type: "boolean" as const },
];

export default function ProFeaturesSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "pro_features"], queryFn: () => adminApi.getConfigCategory("pro_features") });
  return (
    <AdminPageShell title="Pro Features">
      <SettingsForm title="Pro Membership Features" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("pro_features", v)} />
    </AdminPageShell>
  );
}
