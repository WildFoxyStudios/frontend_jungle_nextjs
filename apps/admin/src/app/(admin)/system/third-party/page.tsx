"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "recaptcha_enabled", label: "Enable reCAPTCHA", type: "boolean" as const },
  { key: "recaptcha_site_key", label: "reCAPTCHA Site Key", type: "text" as const },
  { key: "recaptcha_secret_key", label: "reCAPTCHA Secret Key", type: "password" as const },
  { key: "mapbox_token", label: "Mapbox Access Token", type: "password" as const },
  { key: "google_maps_key", label: "Google Maps API Key", type: "password" as const },
  { key: "agora_app_id", label: "Agora App ID", type: "text" as const },
  { key: "agora_certificate", label: "Agora App Certificate", type: "password" as const },
  { key: "firebase_api_key", label: "Firebase API Key", type: "password" as const },
  { key: "firebase_project_id", label: "Firebase Project ID", type: "text" as const },
  { key: "aws_access_key", label: "AWS Access Key", type: "text" as const },
  { key: "aws_secret_key", label: "AWS Secret Key", type: "password" as const },
  { key: "aws_region", label: "AWS Region", type: "text" as const, placeholder: "us-east-1" },
];

export default function ThirdPartyPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "third_party"], queryFn: () => adminApi.getConfigCategory("third_party") });
  return (
    <AdminPageShell title="Third-Party Integrations">
      <SettingsForm title="External Service Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("third_party", v)} />
    </AdminPageShell>
  );
}
