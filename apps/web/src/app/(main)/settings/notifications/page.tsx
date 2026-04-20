"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Switch, Label, Button, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface NotificationSettings {
  e_liked: boolean;
  e_wondered: boolean;
  e_shared: boolean;
  e_followed: boolean;
  e_commented: boolean;
  e_visited: boolean;
  e_mentioned: boolean;
  e_joined_group: boolean;
  e_accepted: boolean;
  e_profile_wall_post: boolean;
  e_memory: boolean;
}

const LABELS: Record<keyof NotificationSettings, string> = {
  e_liked: "Someone likes my post",
  e_wondered: "Someone wonders my post",
  e_shared: "Someone shares my post",
  e_followed: "Someone follows me",
  e_commented: "Someone comments on my post",
  e_visited: "Someone visits my profile",
  e_mentioned: "Someone mentions me",
  e_joined_group: "Someone joins my group",
  e_accepted: "My follow request is accepted",
  e_profile_wall_post: "Someone posts on my wall",
  e_memory: "Memory notifications",
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi.getMe()
      .then((user) => {
        const ns = (user as { notification_settings?: NotificationSettings }).notification_settings;
        if (ns) setSettings(ns);
      })
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const toggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => prev ? { ...prev, [key]: !prev[key] } : prev);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await usersApi.updateMe({ notification_settings: settings } as never);
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {settings && (Object.keys(LABELS) as (keyof NotificationSettings)[]).map((key) => (
          <div key={key} className="flex items-center justify-between">
            <Label htmlFor={key} className="cursor-pointer">{LABELS[key]}</Label>
            <Switch
              id={key}
              checked={settings[key]}
              onCheckedChange={() => toggle(key)}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
          {saving ? "Saving…" : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  );
}
