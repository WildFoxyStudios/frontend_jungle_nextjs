"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "live_video_enabled", label: "Enable Live Streaming", type: "boolean" as const },
  { key: "live_provider", label: "Live Provider", type: "select" as const, options: ["agora", "jitsi", "custom"] },
  { key: "agora_app_id", label: "Agora App ID", type: "text" as const },
  { key: "agora_app_certificate", label: "Agora App Certificate", type: "password" as const },
  { key: "live_max_duration", label: "Max Live Duration (minutes)", type: "number" as const },
  { key: "live_recording_enabled", label: "Enable Live Recording", type: "boolean" as const },
];

export default function LiveSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "live"], queryFn: () => adminApi.getConfigCategory("live") });
  return (
    <AdminPageShell title="Live Settings">
      <SettingsForm title="Live Streaming Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("live", v)} />
    </AdminPageShell>
  );
}
