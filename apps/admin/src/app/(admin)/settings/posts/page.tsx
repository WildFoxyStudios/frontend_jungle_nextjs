"use client";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";

export default function PostsSettingsPage() {
  return (
    <AdminPageShell
      title="Post & content settings"
      description="Post limits, moderation rules, default privacy, and comment/reaction toggles."
    >
      <CatalogSettingsForm category="posts" />
    </AdminPageShell>
  );
}
