"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "meta_title", label: "Default Meta Title", type: "text" as const },
  { key: "meta_description", label: "Default Meta Description", type: "textarea" as const },
  { key: "meta_keywords", label: "Meta Keywords (comma-separated)", type: "text" as const },
  { key: "og_image", label: "Default OG Image URL", type: "url" as const },
  { key: "google_analytics_id", label: "Google Analytics ID", type: "text" as const, placeholder: "G-XXXXXXXXXX" },
  { key: "google_tag_manager_id", label: "Google Tag Manager ID", type: "text" as const, placeholder: "GTM-XXXXXXX" },
  { key: "robots_txt", label: "robots.txt Content", type: "textarea" as const },
  { key: "sitemap_enabled", label: "Enable Auto Sitemap", type: "boolean" as const },
  { key: "canonical_url", label: "Canonical URL", type: "url" as const },
];

export default function SeoSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "seo"], queryFn: () => adminApi.getConfigCategory("seo") });
  return (
    <AdminPageShell title="SEO Settings">
      <SettingsForm title="Search Engine Optimization" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("seo", v)} />
    </AdminPageShell>
  );
}
