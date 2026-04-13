"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "ai_enabled", label: "Enable AI Features", type: "boolean" as const },
  { key: "openai_api_key", label: "OpenAI API Key", type: "password" as const, placeholder: "sk-..." },
  { key: "openai_model", label: "OpenAI Model", type: "select" as const, options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { key: "ai_blog_enabled", label: "AI Blog Generation", type: "boolean" as const },
  { key: "ai_image_enabled", label: "AI Image Generation", type: "boolean" as const },
  { key: "ai_chat_enabled", label: "AI Chat Assistant", type: "boolean" as const },
  { key: "ai_daily_limit", label: "Daily AI Requests per User", type: "number" as const },
];

export default function AiSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "ai"], queryFn: () => adminApi.getConfigCategory("ai") });
  return (
    <AdminPageShell title="AI Settings">
      <SettingsForm title="Artificial Intelligence Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("ai", v)} />
    </AdminPageShell>
  );
}
