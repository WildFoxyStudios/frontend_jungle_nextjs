"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi } from "@jungle/api-client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@jungle/hooks";
import {
 Button, Input, Label, Card, CardContent, CardHeader, CardTitle, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Separator,
} from "@jungle/ui";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

const generalSettingsSchema = z.object({
 first_name: z.string().min(1, "Required").max(50),
 last_name: z.string().min(1, "Required").max(50),
 about: z.string().max(500).optional(),
 gender: z.string().optional(),
 birthday: z.string().optional(),
 website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
 location: z.string().max(200).optional(),
 phone: z.string().max(40).optional(),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;

export default function SettingsPage() {
 const { user, setUser } = useAuthStore();
 const [exporting, setExporting] = useState(false);
 const t = useTranslations("settings");
 const tp = useTranslations("profile");
 const ta = useTranslations("auth");
 const tc = useTranslations("common");
 const te = useTranslations("settings_extra");
 const {
 register,
 handleSubmit,
 reset,
 setValue,
 watch,
 formState: { errors, isSubmitting },
 } = useForm<GeneralSettingsForm>({
 resolver: zodResolver(generalSettingsSchema),
 });

 useEffect(() => {
 usersApi.getMe().then((me) => {
 reset({
 first_name: me.first_name,
 last_name: me.last_name,
 about: me.about ?? "",
 gender: me.gender ?? "",
 birthday: me.birthday ?? "",
 website: me.website ?? "",
 location: me.location ?? "",
 phone: me.phone ?? "",
 });
 }).catch(() => { /* non-critical: failure is silent */ });
 }, [reset]);

 const watchGender = watch("gender");

 const onSubmit = async (data: GeneralSettingsForm) => {
 try {
 const updated = await usersApi.updateMe(data);
 if (user) {
 setUser({ 
 ...user, 
 first_name: updated.first_name, 
 last_name: updated.last_name, 
 phone: updated.phone,
 about: updated.about,
 gender: updated.gender,
 birthday: updated.birthday,
 location: updated.location,
 website: updated.website,
 name: `${updated.first_name} ${updated.last_name}`.trim() 
 });
 }
 toast.success(tp("profileUpdated"));
 } catch (err) {
 toast.error(err instanceof Error ? err.message : tc("error"));
 }
 };

 return (
 <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>

 <Card>
 <CardHeader><CardTitle>{tp("editProfile")}</CardTitle></CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <div className="space-y-3 bg-muted/40 p-4">
 <div>
 <p className="text-xs font-semibold text-muted-foreground">Email</p>
 <p className="text-sm font-semibold">{user?.email ?? "No email available"}</p>
 </div>
 {user?.email_verified === false && (
 <Button asChild size="sm" variant="outline">
 <Link href="/verify?type=email">Verify email</Link>
 </Button>
 )}
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <Label>{ta("firstName")}</Label>
 <Input {...register("first_name")} />
 {errors.first_name && (
 <p className="text-xs text-destructive">{errors.first_name.message}</p>
 )}
 </div>
 <div className="space-y-1">
 <Label>{ta("lastName")}</Label>
 <Input {...register("last_name")} />
 {errors.last_name && (
 <p className="text-xs text-destructive">{errors.last_name.message}</p>
 )}
 </div>
 </div>
 
 <div className="space-y-1">
 <Label>{tp("about")}</Label>
 <Textarea {...register("about")} rows={3} />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1">
 <Label>{tp("gender")}</Label>
 <Select value={watchGender ?? ""} onValueChange={(v) => setValue("gender", v)}>
 <SelectTrigger><SelectValue placeholder={te("gender.select")} /></SelectTrigger>
 <SelectContent>
 <SelectItem value="male">{te("gender.male")}</SelectItem>
 <SelectItem value="female">{te("gender.female")}</SelectItem>
 <SelectItem value="other">{te("gender.other")}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1">
 <Label>{tp("birthday")}</Label>
 <Input type="date" {...register("birthday")} />
 </div>
 </div>

 <div className="space-y-1">
 <Label>{tp("location")}</Label>
 <Input {...register("location")} placeholder={te("locationPlaceholder")} />
 {errors.location && (
 <p className="text-xs text-destructive">{errors.location.message}</p>
 )}
 </div>

 <div className="space-y-1">
 <Label>Phone</Label>
 <Input {...register("phone")} type="tel" placeholder="+1 555 123 4567" />
 {errors.phone && (
 <p className="text-xs text-destructive">{errors.phone.message}</p>
 )}
 </div>

 <div className="space-y-1">
 <Label>{tp("website")}</Label>
 <Input {...register("website")} type="url" placeholder="https://example.com" />
 {errors.website && (
 <p className="text-xs text-destructive">{errors.website.message}</p>
 )}
 </div>

 <Button type="submit" disabled={isSubmitting}>
 {isSubmitting ? tc("loading") : tc("save")}
 </Button>
 </form>
 </CardContent>
 </Card>

 {/* Export data */}
 <Card>
 <CardHeader><CardTitle className="text-base">{te("exportData")}</CardTitle></CardHeader>
 <CardContent className="space-y-3">
 <p className="text-sm text-muted-foreground">
 {te("exportDesc")}
 </p>
 <Separator />
 <Button
 variant="outline"
 className="gap-2"
 disabled={exporting}
 onClick={async () => {
 setExporting(true);
 try {
 const res = await usersApi.downloadMyInfo(["my_information", "posts", "pages", "groups", "followers", "following", "friends"]);
 if (res.data) {
 const dataStr = JSON.stringify(res.data, null, 2);
 const dataBlob = new Blob([dataStr], { type: "application/json" });
 const url = URL.createObjectURL(dataBlob);
 const link = document.createElement("a");
 link.href = url;
 link.download = "my-information.json";
 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 } else {
 toast.success(te("exportPrepared"));
 }
 } catch {
 toast.error(te("exportFailed"));
 } finally {
 setExporting(false);
 }
 }}
 >
 <Download className="h-4 w-4" />
 {exporting ? te("requesting") : te("downloadMyData")}
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
