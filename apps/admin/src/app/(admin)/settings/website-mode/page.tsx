"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "website_mode", label: "Website Mode", type: "select" as const, options: ["normal", "linkedin", "instagram", "patreon"] },
  { key: "connectivity_system", label: "Connectivity System (friends vs followers)", type: "select" as const, options: ["followers", "friends"] },
  { key: "open_to_work_enabled", label: "Enable Open to Work (LinkedIn mode)", type: "boolean" as const },
  { key: "providing_service_enabled", label: "Enable Providing Service (LinkedIn mode)", type: "boolean" as const },
  { key: "patreon_enabled", label: "Enable Creator Monetization (Patreon mode)", type: "boolean" as const },
  { key: "common_things_enabled", label: "Enable Common Things Feature", type: "boolean" as const },
];

export default function WebsiteModeSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "website_mode"], queryFn: () => adminApi.getConfigCategory("website_mode") });
  return (
    <AdminPageShell title="Website Mode">
      <SettingsForm title="Site Mode & Connectivity" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("website_mode", v)} />
    </AdminPageShell>
  );
}
