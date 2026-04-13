"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "smtp_host", label: "SMTP Host", type: "text" as const },
  { key: "smtp_port", label: "SMTP Port", type: "number" as const },
  { key: "smtp_user", label: "SMTP Username", type: "text" as const },
  { key: "smtp_password", label: "SMTP Password", type: "password" as const },
  { key: "smtp_from", label: "From Email", type: "email" as const },
  { key: "smtp_from_name", label: "From Name", type: "text" as const },
  { key: "smtp_encryption", label: "Encryption (tls/ssl)", type: "text" as const },
];

export default function EmailSettingsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "config", "email"],
    queryFn: () => adminApi.getConfigCategory("email"),
  });

  return (
    <AdminPageShell title="Email Settings">
      <SettingsForm
        title="SMTP Configuration"
        fields={FIELDS}
        initialValues={data ?? {}}
        onSave={(values) => adminApi.updateConfigCategory("email", values)}
      />
    </AdminPageShell>
  );
}
