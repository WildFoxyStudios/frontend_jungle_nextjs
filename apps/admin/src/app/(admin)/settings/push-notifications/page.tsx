"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "push_notifications_enabled", label: "Enable Push Notifications", type: "boolean" as const },
  { key: "fcm_server_key", label: "FCM Server Key (Android)", type: "password" as const },
  { key: "fcm_sender_id", label: "FCM Sender ID", type: "text" as const },
  { key: "apns_key_id", label: "APNs Key ID (iOS)", type: "text" as const },
  { key: "apns_team_id", label: "APNs Team ID", type: "text" as const },
  { key: "apns_bundle_id", label: "APNs Bundle ID", type: "text" as const, placeholder: "com.example.app" },
  { key: "web_push_vapid_public", label: "Web Push VAPID Public Key", type: "text" as const },
  { key: "web_push_vapid_private", label: "Web Push VAPID Private Key", type: "password" as const },
  { key: "onesignal_app_id", label: "OneSignal App ID (optional)", type: "text" as const },
  { key: "onesignal_api_key", label: "OneSignal REST API Key", type: "password" as const },
];

export default function PushNotificationsSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "push_notifications"], queryFn: () => adminApi.getConfigCategory("push_notifications") });
  return (
    <AdminPageShell title="Push Notifications">
      <SettingsForm title="Push Notification Providers" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("push_notifications", v)} />
    </AdminPageShell>
  );
}
