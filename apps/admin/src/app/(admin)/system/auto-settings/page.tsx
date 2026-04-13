"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { toast } from "sonner";

const FIELDS = [
  { key: "auto_delete_posts_days", label: "Auto-delete posts after (days, 0 = disabled)", type: "number" as const },
  { key: "auto_delete_stories_hours", label: "Auto-delete stories after (hours)", type: "number" as const },
  { key: "auto_delete_notifications_days", label: "Auto-delete notifications after (days)", type: "number" as const },
  { key: "auto_delete_messages_days", label: "Auto-delete messages after (days, 0 = disabled)", type: "number" as const },
  { key: "auto_follow_enabled", label: "Enable Auto-Follow for New Users", type: "boolean" as const },
  { key: "auto_join_enabled", label: "Enable Auto-Join Groups for New Users", type: "boolean" as const },
  { key: "auto_like_enabled", label: "Enable Auto-Like Pages for New Users", type: "boolean" as const },
];

export default function AutoSettingsPage() {
  const { data } = useQuery({
    queryKey: ["admin", "auto-settings"],
    queryFn: () => adminApi.getAutoSettings(),
  });

  return (
    <AdminPageShell title="Auto Settings">
      <SettingsForm
        title="Automated Actions Configuration"
        fields={FIELDS}
        initialValues={(data ?? {}) as Record<string, unknown>}
        onSave={async (values) => {
          await adminApi.updateAutoDeleteSettings(values);
          toast.success("Auto settings saved");
        }}
      />
    </AdminPageShell>
  );
}
