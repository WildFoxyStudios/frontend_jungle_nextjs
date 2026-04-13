"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "sms_provider", label: "SMS Provider", type: "select" as const, options: ["twilio", "infobip", "msg91", "nexmo", "custom"] },
  { key: "twilio_sid", label: "Twilio Account SID", type: "text" as const },
  { key: "twilio_token", label: "Twilio Auth Token", type: "password" as const },
  { key: "twilio_from", label: "Twilio From Number", type: "text" as const, placeholder: "+1234567890" },
  { key: "infobip_api_key", label: "Infobip API Key", type: "password" as const },
  { key: "infobip_sender", label: "Infobip Sender ID", type: "text" as const },
  { key: "msg91_auth_key", label: "MSG91 Auth Key", type: "password" as const },
  { key: "msg91_sender_id", label: "MSG91 Sender ID", type: "text" as const },
];

export default function SmsSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "sms"], queryFn: () => adminApi.getConfigCategory("sms") });
  return (
    <AdminPageShell title="SMS Settings">
      <SettingsForm title="SMS Provider Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("sms", v)} />
    </AdminPageShell>
  );
}
