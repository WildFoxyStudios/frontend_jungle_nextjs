"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "site_name", label: "Site Name", type: "text" as const, placeholder: "Jungle" },
  { key: "site_url", label: "Site URL", type: "url" as const, placeholder: "https://example.com" },
  { key: "site_email", label: "Contact Email", type: "email" as const },
  { key: "timezone", label: "Timezone", type: "text" as const, placeholder: "UTC" },
];

export default function GeneralSettingsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "config", "general"],
    queryFn: () => adminApi.getConfigCategory("general"),
  });

  return (
    <AdminPageShell title="General Settings">
      <SettingsForm
        title="Site Configuration"
        fields={FIELDS}
        initialValues={data ?? {}}
        onSave={(values) => adminApi.updateConfigCategory("general", values)}
      />
    </AdminPageShell>
  );
}
