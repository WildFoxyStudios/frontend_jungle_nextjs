"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsForm } from "@/components/admin/SettingsForm";

const FIELDS = [
  { key: "user_registration", label: "Allow User Registration", type: "boolean" as const },
  { key: "email_verification", label: "Require Email Verification", type: "boolean" as const },
  { key: "sms_verification", label: "Require SMS Verification", type: "boolean" as const },
  { key: "invitation_only", label: "Invitation Only Mode", type: "boolean" as const },
  { key: "two_factor_enabled", label: "Enable Two-Factor Auth", type: "boolean" as const },
  { key: "two_factor_type", label: "2FA Method", type: "select" as const, options: ["email", "sms", "both", "app"] },
  { key: "login_auth", label: "Unusual Login Detection", type: "boolean" as const },
  { key: "confirm_followers", label: "Confirm Followers by Default", type: "boolean" as const },
  { key: "min_password_length", label: "Minimum Password Length", type: "number" as const },
];

export default function AuthSettingsPage() {
  const { data } = useQuery({ queryKey: ["admin", "config", "auth"], queryFn: () => adminApi.getConfigCategory("auth") });
  return (
    <AdminPageShell title="Auth Settings">
      <SettingsForm title="Authentication Configuration" fields={FIELDS} initialValues={data ?? {}} onSave={(v) => adminApi.updateConfigCategory("auth", v)} />
    </AdminPageShell>
  );
}
