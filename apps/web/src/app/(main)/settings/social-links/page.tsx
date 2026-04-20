"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

const SOCIAL_FIELDS = [
  { key: "website", label: "Website", placeholder: "https://yourwebsite.com" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "twitter", label: "Twitter / X", placeholder: "https://twitter.com/username" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
];

export default function SocialLinksPage() {
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getMe()
      .then((user) => {
        const sl = user.social_links ?? {};
        setLinks({ website: user.website ?? "", ...sl });
      })
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersApi.updateSocialLinks(links);
      toast.success("Social links saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Input
              type="url"
              placeholder={placeholder}
              value={links[key] ?? ""}
              onChange={(e) => setLinks((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save Social Links"}
        </Button>
      </CardContent>
    </Card>
  );
}
