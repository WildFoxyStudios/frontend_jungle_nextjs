"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import {
 Card,
 CardContent,
 CardHeader,
 CardTitle,
 Button,
 Label,
 Skeleton,
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
 Switch,
} from "@jungle/ui";
import { toast } from "sonner";

/** Plan §3.20 PV1-PV4 — keys mirror `users.privacy_settings`. */
const PRIVACY_OPTIONS = ["everyone", "followers", "mutual", "only_me"] as const;
const privacyChoice = z.enum(PRIVACY_OPTIONS);

const privacyFormSchema = z.object({
 follow_privacy: privacyChoice,
 message_privacy: privacyChoice,
 post_privacy: privacyChoice,
 profile_visibility: privacyChoice,
 friend_privacy: privacyChoice,
 birth_privacy: privacyChoice,
 confirm_followers: z.boolean(),
 show_activities: z.boolean(),
 show_lastseen: z.boolean(),
 online_status: z.boolean(),
 share_my_location: z.boolean(),
 share_my_data: z.boolean(),
});

export type PrivacyFormValues = z.infer<typeof privacyFormSchema>;

const DEFAULT_PRIVACY: PrivacyFormValues = {
 follow_privacy: "everyone",
 message_privacy: "everyone",
 post_privacy: "everyone",
 profile_visibility: "everyone",
 friend_privacy: "everyone",
 birth_privacy: "everyone",
 confirm_followers: false,
 show_activities: true,
 show_lastseen: true,
 online_status: true,
 share_my_location: false,
 share_my_data: false,
};

function coerceChoice(raw: unknown): z.infer<typeof privacyChoice> {
 const s = typeof raw === "string" ? raw : "";
 const p = privacyChoice.safeParse(s);
 return p.success ? p.data : "everyone";
}

function hydrateFromApi(raw: Partial<Record<keyof PrivacyFormValues, unknown>> | undefined): PrivacyFormValues {
 const base = { ...DEFAULT_PRIVACY, ...(raw ?? {}) };
 return {
 follow_privacy: coerceChoice(raw?.follow_privacy ?? base.follow_privacy),
 message_privacy: coerceChoice(raw?.message_privacy ?? base.message_privacy),
 post_privacy: coerceChoice(raw?.post_privacy ?? base.post_privacy),
 profile_visibility: coerceChoice(raw?.profile_visibility ?? base.profile_visibility),
 friend_privacy: coerceChoice(raw?.friend_privacy ?? base.friend_privacy),
 birth_privacy: coerceChoice(raw?.birth_privacy ?? base.birth_privacy),
 confirm_followers: Boolean(raw?.confirm_followers ?? base.confirm_followers),
 show_activities: Boolean(raw?.show_activities ?? base.show_activities),
 show_lastseen: Boolean(raw?.show_lastseen ?? base.show_lastseen),
 online_status: Boolean(raw?.online_status ?? base.online_status),
 share_my_location: Boolean(raw?.share_my_location ?? base.share_my_location),
 share_my_data: Boolean(raw?.share_my_data ?? base.share_my_data),
 };
}

const SELECT_FIELDS: { key: keyof Pick<
 PrivacyFormValues,
 | "follow_privacy"
 | "message_privacy"
 | "post_privacy"
 | "profile_visibility"
 | "friend_privacy"
 | "birth_privacy"
>; label: string }[] = [
 { key: "follow_privacy", label: "Who can follow me" },
 { key: "message_privacy", label: "Who can message me" },
 { key: "post_privacy", label: "Default post visibility" },
 { key: "profile_visibility", label: "Who can see my profile" },
 { key: "friend_privacy", label: "Who can see my friends list" },
 { key: "birth_privacy", label: "Who can see my birthday" },
];

const TOGGLE_FIELDS: { key: keyof Pick<
 PrivacyFormValues,
 | "confirm_followers"
 | "show_activities"
 | "show_lastseen"
 | "online_status"
 | "share_my_location"
 | "share_my_data"
>; label: string }[] = [
 { key: "confirm_followers", label: "Manually approve followers" },
 { key: "show_activities", label: "Show my activities" },
 { key: "show_lastseen", label: "Show last seen time" },
 { key: "online_status", label: "Show online status" },
 { key: "share_my_location", label: "Attach my location to new posts" },
 { key: "share_my_data", label: "Allow search engines to index my profile (GDPR)" },
];

export default function PrivacySettingsPage() {
 const [loading, setLoading] = useState(true);

 const {
 control,
 handleSubmit,
 reset,
 formState: { isSubmitting },
 } = useForm<PrivacyFormValues>({
 resolver: zodResolver(privacyFormSchema),
 defaultValues: DEFAULT_PRIVACY,
 });

 useEffect(() => {
 usersApi
 .getMe()
 .then((user) => {
 const raw = (user as { privacy_settings?: Partial<Record<keyof PrivacyFormValues, unknown>> }).privacy_settings;
 reset(hydrateFromApi(raw));
 })
	.catch((err) => {
		console.error("[PrivacySettings] getMe failed, using defaults", err);
		reset(DEFAULT_PRIVACY);
	})
 .finally(() => setLoading(false));
 }, [reset]);

 const onSave = handleSubmit(async (data) => {
 try {
 await usersApi.updateMe({ privacy_settings: data } as never);
 toast.success("Privacy settings saved");
	} catch (err) {
		console.error("[PrivacySettings] save failed", err);
		toast.error("Failed to save");
	}
 });

 if (loading) return <Skeleton className="h-64 w-full" />;

 return (
 <Card>
 <CardHeader>
 <CardTitle>Privacy Settings</CardTitle>
 </CardHeader>
 <form onSubmit={onSave}>
 <CardContent className="space-y-5">
 {SELECT_FIELDS.map(({ key, label }) => (
 <div key={key} className="space-y-1.5">
 <Label>{label}</Label>
 <Controller
 control={control}
 name={key}
 render={({ field }) => (
 <Select value={field.value} onValueChange={field.onChange}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {PRIVACY_OPTIONS.map((opt) => (
 <SelectItem key={opt} value={opt} className="capitalize">
 {opt.replace("_", " ")}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 )}
 />
 </div>
 ))}

 <div className="space-y-2 border-t pt-2">
 {TOGGLE_FIELDS.map(({ key, label }) => (
 <div
 key={key}
 className="flex items-center justify-between p-3"
 >
 <Label htmlFor={key} className="cursor-pointer">
 {label}
 </Label>
 <Controller
 control={control}
 name={key}
 render={({ field }) => (
 <Switch
 id={key}
 checked={field.value}
 onCheckedChange={field.onChange}
 />
 )}
 />
 </div>
 ))}
 </div>

 <Button type="submit" disabled={isSubmitting} className="w-full">
 {isSubmitting ? "Saving…" : "Save Privacy Settings"}
 </Button>
 </CardContent>
 </form>
 </Card>
 );
}


