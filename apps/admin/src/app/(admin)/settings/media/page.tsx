"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "storage_provider", label: "Storage Provider", type: "select" as const, options: ["local", "s3", "minio", "wasabi", "spaces", "backblaze"] },
  { key: "s3_key", label: "S3 Access Key", type: "text" as const },
  { key: "s3_secret", label: "S3 Secret Key", type: "password" as const },
  { key: "s3_bucket", label: "S3 Bucket Name", type: "text" as const },
  { key: "s3_region", label: "S3 Region", type: "text" as const },
  { key: "s3_endpoint", label: "S3 Endpoint URL", type: "url" as const },
  { key: "max_upload_size", label: "Max Upload Size (MB)", type: "number" as const },
  { key: "allowed_extensions", label: "Allowed Extensions (comma-separated)", type: "text" as const, placeholder: "jpg,png,gif,mp4,pdf" },
  { key: "watermark_enabled", label: "Enable Watermark", type: "boolean" as const },
  { key: "images_quality", label: "Image Quality (1-100)", type: "number" as const },
];

export default function MediaSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "media"], queryFn: () => adminApi.getConfigCategory("media") });
  return (
    <AdminPageShell title="Media Settings">
      <SettingsForm title="Storage & Media Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("media", v)} />
    </AdminPageShell>
  );
}
