"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "google_enabled", label: "Enable Google Login", type: "boolean" as const },
  { key: "google_client_id", label: "Google Client ID", type: "text" as const },
  { key: "google_client_secret", label: "Google Client Secret", type: "password" as const },
  { key: "facebook_enabled", label: "Enable Facebook Login", type: "boolean" as const },
  { key: "facebook_app_id", label: "Facebook App ID", type: "text" as const },
  { key: "facebook_app_secret", label: "Facebook App Secret", type: "password" as const },
  { key: "twitter_enabled", label: "Enable Twitter Login", type: "boolean" as const },
  { key: "twitter_api_key", label: "Twitter API Key", type: "text" as const },
  { key: "twitter_api_secret", label: "Twitter API Secret", type: "password" as const },
  { key: "apple_enabled", label: "Enable Apple Login", type: "boolean" as const },
  { key: "apple_client_id", label: "Apple Client ID", type: "text" as const },
  { key: "apple_team_id", label: "Apple Team ID", type: "text" as const },
  { key: "apple_key_id", label: "Apple Key ID", type: "text" as const },
  { key: "linkedin_enabled", label: "Enable LinkedIn Login", type: "boolean" as const },
  { key: "linkedin_client_id", label: "LinkedIn Client ID", type: "text" as const },
  { key: "linkedin_client_secret", label: "LinkedIn Client Secret", type: "password" as const },
  { key: "discord_enabled", label: "Enable Discord Login", type: "boolean" as const },
  { key: "discord_client_id", label: "Discord Client ID", type: "text" as const },
  { key: "discord_client_secret", label: "Discord Client Secret", type: "password" as const },
  { key: "tiktok_enabled", label: "Enable TikTok Login", type: "boolean" as const },
  { key: "tiktok_client_key", label: "TikTok Client Key", type: "text" as const },
  { key: "tiktok_client_secret", label: "TikTok Client Secret", type: "password" as const },
  { key: "vkontakte_enabled", label: "Enable VKontakte Login", type: "boolean" as const },
  { key: "vkontakte_app_id", label: "VKontakte App ID", type: "text" as const },
  { key: "vkontakte_secret", label: "VKontakte Secret", type: "password" as const },
];

export default function SocialLoginSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "social_login"], queryFn: () => adminApi.getConfigCategory("social_login") });
  return (
    <AdminPageShell title="Social Login Settings">
      <SettingsForm title="OAuth Provider Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("social_login", v)} />
    </AdminPageShell>
  );
}
