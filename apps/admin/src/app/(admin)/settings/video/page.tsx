"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "video_chat_enabled", label: "Enable Video Calls", type: "boolean" as const },
  { key: "audio_chat_enabled", label: "Enable Audio Calls", type: "boolean" as const },
  { key: "video_provider", label: "Video Provider", type: "select" as const, options: ["agora", "jitsi", "twilio_video"] },
  { key: "agora_app_id", label: "Agora App ID", type: "text" as const },
  { key: "agora_app_certificate", label: "Agora App Certificate", type: "password" as const },
  { key: "jitsi_server", label: "Jitsi Server URL", type: "url" as const, placeholder: "https://meet.jit.si" },
  { key: "call_max_duration", label: "Max Call Duration (minutes)", type: "number" as const },
  { key: "call_recording_enabled", label: "Enable Call Recording", type: "boolean" as const },
];

export default function VideoSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "video"], queryFn: () => adminApi.getConfigCategory("video") });
  return (
    <AdminPageShell title="Video Settings">
      <SettingsForm title="Video & Audio Call Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("video", v)} />
    </AdminPageShell>
  );
}
