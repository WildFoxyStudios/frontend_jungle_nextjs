"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "max_characters", label: "Max Post Characters", type: "number" as const },
  { key: "post_limit_per_day", label: "Post Limit per Day (0 = unlimited)", type: "number" as const },
  { key: "post_approval", label: "Require Post Approval", type: "boolean" as const },
  { key: "blog_approval", label: "Require Blog Approval", type: "boolean" as const },
  { key: "max_multi_images", label: "Max Images per Post", type: "number" as const },
  { key: "colored_posts_enabled", label: "Enable Colored Posts", type: "boolean" as const },
  { key: "polls_enabled", label: "Enable Polls", type: "boolean" as const },
  { key: "feelings_enabled", label: "Enable Feelings/Activities", type: "boolean" as const },
  { key: "location_enabled", label: "Enable Location Tagging", type: "boolean" as const },
  { key: "link_preview_enabled", label: "Enable Link Previews", type: "boolean" as const },
  { key: "post_sharing_enabled", label: "Enable Post Sharing", type: "boolean" as const },
];

export default function PostsSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "posts"], queryFn: () => adminApi.getConfigCategory("posts") });
  return (
    <AdminPageShell title="Post Settings">
      <SettingsForm title="Post & Content Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("posts", v)} />
    </AdminPageShell>
  );
}
