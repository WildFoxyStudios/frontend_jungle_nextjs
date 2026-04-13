"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "logo_url", label: "Logo URL", type: "url" as const },
  { key: "favicon_url", label: "Favicon URL", type: "url" as const },
  { key: "primary_color", label: "Primary Color (hex)", type: "text" as const, placeholder: "#3b82f6" },
  { key: "secondary_color", label: "Secondary Color (hex)", type: "text" as const, placeholder: "#10b981" },
  { key: "dark_mode_default", label: "Default to Dark Mode", type: "boolean" as const },
  { key: "allow_user_theme", label: "Allow Users to Change Theme", type: "boolean" as const },
  { key: "custom_css", label: "Custom CSS", type: "textarea" as const },
  { key: "header_code", label: "Custom Header Code (HTML/JS)", type: "textarea" as const },
  { key: "footer_code", label: "Custom Footer Code (HTML/JS)", type: "textarea" as const },
  { key: "maintenance_mode", label: "Maintenance Mode", type: "boolean" as const },
  { key: "maintenance_message", label: "Maintenance Message", type: "text" as const },
];

export default function AppearanceSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "appearance"], queryFn: () => adminApi.getConfigCategory("appearance") });
  return (
    <AdminPageShell title="Appearance Settings">
      <SettingsForm title="Site Design & Appearance" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("appearance", v)} />
    </AdminPageShell>
  );
}
