"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Label, Skeleton, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from "@jungle/ui";
import { toast } from "sonner";

interface PrivacySettings {
  follow_privacy: string;
  message_privacy: string;
  post_privacy: string;
  profile_visibility: string;
  confirm_followers: boolean;
  show_activities: boolean;
  show_lastseen: boolean;
  online_status: boolean;
}

const PRIVACY_OPTIONS = ["everyone", "followers", "mutual", "only_me"];

const SELECT_FIELDS: { key: keyof PrivacySettings; label: string }[] = [
  { key: "follow_privacy", label: "Who can follow me" },
  { key: "message_privacy", label: "Who can message me" },
  { key: "post_privacy", label: "Default post visibility" },
  { key: "profile_visibility", label: "Who can see my profile" },
];

const TOGGLE_FIELDS: { key: keyof PrivacySettings; label: string }[] = [
  { key: "confirm_followers", label: "Manually approve followers" },
  { key: "show_activities", label: "Show my activities" },
  { key: "show_lastseen", label: "Show last seen time" },
  { key: "online_status", label: "Show online status" },
];

export default function PrivacySettingsPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getMe()
      .then((user) => {
        const ps = (user as { privacy_settings?: PrivacySettings }).privacy_settings;
        if (ps) setSettings(ps);
      })
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await usersApi.updateMe({ privacy_settings: settings } as never);
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!settings) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Privacy Settings</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        {SELECT_FIELDS.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label>{label}</Label>
            <Select
              value={settings[key] as string}
              onValueChange={(v) => setSettings((s) => s ? { ...s, [key]: v } : s)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIVACY_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="capitalize">{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <div className="space-y-3 pt-2 border-t">
          {TOGGLE_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={key} className="cursor-pointer">{label}</Label>
              <Switch
                id={key}
                checked={settings[key] as boolean}
                onCheckedChange={(v) => setSettings((s) => s ? { ...s, [key]: v } : s)}
              />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save Privacy Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
