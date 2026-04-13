"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FEATURES = [
  "groups", "pages", "events", "blogs", "forums", "marketplace", "jobs",
  "funding", "movies", "games", "stories", "reels", "live", "pokes",
  "gifts", "colored_posts", "points", "affiliates", "ads", "monetization", "ai",
];

const FIELDS = FEATURES.map((f) => ({
  key: f,
  label: f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  type: "toggle" as const,
}));

export default function FeaturesPage() {
  const { data } = useQuery({
    queryKey: ["admin", "config", "features"],
    queryFn: () => adminApi.getConfigCategory("features"),
  });

  return (
    <AdminPageShell title="Feature Toggles" description="Enable or disable platform features.">
      <SettingsForm
        title="Features"
        fields={FIELDS}
        initialValues={data ?? {}}
        onSave={(values) => adminApi.updateConfigCategory("features", values)}
      />
    </AdminPageShell>
  );
}
