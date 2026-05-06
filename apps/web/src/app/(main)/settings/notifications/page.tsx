"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import {
 Card, CardContent, CardHeader, CardTitle,
 Switch, Label, Button, Skeleton,
 Tabs, TabsList, TabsTrigger, TabsContent,
} from "@jungle/ui";
import { toast } from "sonner";

/**
 * Plan §3.19 — mirror the PHP Sunshine UI: one screen with two tabs
 * (in-app vs email). We persist both maps in two JSONB columns:
 * * `users.notification_settings` — in-app (WebSocket + DB rows)
 * * `users.email_notification_settings` — email channel opt-outs
 *
 * Extra keys surfaced compared to the original React version:
 * * `e_liked_page` (PR liked a page I own)
 * * `e_memory` (daily memories digest)
 * * `e_visited` (somebody viewed my profile)
 * * `e_joined_group` (member approved into my group)
 */
type NotificationKey =
 | "e_liked"
 | "e_wondered"
 | "e_shared"
 | "e_followed"
 | "e_commented"
 | "e_visited"
 | "e_mentioned"
 | "e_joined_group"
 | "e_accepted"
 | "e_profile_wall_post"
 | "e_memory"
 | "e_liked_page";

type NotificationSettings = Record<NotificationKey, boolean>;

const LABELS: Record<NotificationKey, string> = {
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
 e_liked_page: "Someone likes a page I admin",
};

/** All keys default to `true` so the UI never shows a phantom "off". */
function hydrate(raw: Partial<NotificationSettings> | undefined): NotificationSettings {
 const defaults = Object.fromEntries(
 (Object.keys(LABELS) as NotificationKey[]).map((k) => [k, true]),
 ) as NotificationSettings;
 return { ...defaults, ...(raw ?? {}) };
}

export default function NotificationSettingsPage() {
 const [inApp, setInApp] = useState<NotificationSettings | null>(null);
 const [email, setEmail] = useState<NotificationSettings | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [tab, setTab] = useState("in-app");

 useEffect(() => {
 usersApi
 .getMe()
 .then((user) => {
 const u = user as unknown as {
 notification_settings?: Partial<NotificationSettings>;
 email_notification_settings?: Partial<NotificationSettings>;
 };
 setInApp(hydrate(u.notification_settings));
 setEmail(hydrate(u.email_notification_settings));
 })
 .catch(() => {
 // Fall back to defaults so the form still renders when the profile
 // endpoint is unreachable.
 setInApp(hydrate(undefined));
 setEmail(hydrate(undefined));
 })
 .finally(() => setLoading(false));
 }, []);

 const handleSave = async () => {
 if (!inApp || !email) return;
 setSaving(true);
 try {
 await usersApi.updateMe({
 notification_settings: inApp,
 email_notification_settings: email,
 } as never);
 toast.success("Notification preferences saved");
 } catch {
 toast.error("Failed to save preferences");
 } finally {
 setSaving(false);
 }
 };

 if (loading) return <Skeleton className="h-64 w-full" />;
 if (!inApp || !email) return null;

 const renderChannel = (
 state: NotificationSettings,
 setter: (next: NotificationSettings) => void,
 idPrefix: string,
 ) => (
 <div className="space-y-2">
 {(Object.keys(LABELS) as NotificationKey[]).map((key) => (
 <div key={key} className="flex items-center justify-between p-3">
 <Label htmlFor={`${idPrefix}-${key}`} className="cursor-pointer">
 {LABELS[key]}
 </Label>
 <Switch
 id={`${idPrefix}-${key}`}
 checked={state[key]}
 onCheckedChange={(v) => setter({ ...state, [key]: v })}
 />
 </div>
 ))}
 </div>
 );

 return (
 <Card>
 <CardHeader>
 <CardTitle>Notification Preferences</CardTitle>
 </CardHeader>
 <CardContent>
 <Tabs value={tab} onValueChange={setTab} className="space-y-4">
 <TabsList className="grid w-full grid-cols-2">
 <TabsTrigger value="in-app">In-app</TabsTrigger>
 <TabsTrigger value="email">Email</TabsTrigger>
 </TabsList>
 <TabsContent value="in-app" className="space-y-4 pt-2">
 {renderChannel(inApp, setInApp, "inapp")}
 </TabsContent>
 <TabsContent value="email" className="space-y-4 pt-2">
 {renderChannel(email, setEmail, "email")}
 </TabsContent>
 </Tabs>
 <Button onClick={handleSave} disabled={saving} className="w-full mt-6">
 {saving ? "Saving…" : "Save Preferences"}
 </Button>
 </CardContent>
 </Card>
 );
}
