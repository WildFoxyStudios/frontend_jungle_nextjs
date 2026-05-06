"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { resolveAvatarUrl, resolveCoverUrl, isDefaultCoverValue } from "@/lib/avatar";
import { CoverUpload } from "@/components/profile/CoverUpload";
import { PlacesAutocomplete } from "@/components/shared/PlacesAutocomplete";

const profileSchema = z.object({
 first_name: z.string().min(1, "Required").max(50),
 last_name: z.string().min(1, "Required").max(50),
 username: z.string().min(3).max(30).regex(/^[\w.\-]+$/, "Letters, numbers, _ . - only"),
 about: z.string().max(500).optional(),
 gender: z.string().optional(),
 birthday: z.string().optional(),
 location: z.string().max(100).optional(),
 website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
 working: z.string().max(100).optional(),
 working_link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
 school: z.string().max(100).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
 const { user, setUser } = useAuthStore();
 const [loading, setLoading] = useState(true);
 const [isUploading, setIsUploading] = useState(false);

 const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
 resolver: zodResolver(profileSchema),
 });

 useEffect(() => {
 usersApi.getMe().then((u) => {
 reset({
 first_name: u.first_name,
 last_name: u.last_name,
 username: u.username,
 about: u.about ?? "",
 gender: u.gender ?? "",
 birthday: u.birthday ?? "",
 location: u.location ?? "",
 website: u.website ?? "",
 working: u.working ?? "",
 working_link: u.working_link ?? "",
 school: u.school ?? "",
 });
 setLoading(false);
 }).catch(() => { toast.error("Failed to load profile"); setLoading(false); });
 }, [reset]);

 const onSubmit = async (data: ProfileForm) => {
 try {
 const updated = await usersApi.updateMe(data);
 setUser({
 ...user!,
 username: updated.username,
 first_name: updated.first_name,
 last_name: updated.last_name,
 avatar: updated.avatar,
 cover: updated.cover,
 about: updated.about,
 gender: updated.gender,
 birthday: updated.birthday,
 location: updated.location,
 website: updated.website,
 working: updated.working,
 working_link: updated.working_link,
 school: updated.school,
 social_links: updated.social_links,
 name: `${updated.first_name} ${updated.last_name}`.trim(),
 });
 toast.success("Profile saved");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to save profile");
 }
 };

 const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsUploading(true);
 try {
 const fd = new FormData();
 fd.append("avatar", file);
 const res = await usersApi.updateAvatar(fd);
 if (user) setUser({ ...user, avatar: res.avatar });
 toast.success("Avatar updated");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
 } finally {
 setIsUploading(false);
 e.target.value = "";
 }
 };

 if (loading) return <Skeleton className="h-96 w-full" />;

 return (
 <div className="space-y-6 max-w-2xl">
 <h1 className="text-2xl font-bold sm:text-[28px]">Profile Settings</h1>

 {/* Avatar */}
 <Card>
 <CardHeader><CardTitle>Profile Photo</CardTitle></CardHeader>
 <CardContent className="flex items-center gap-6">
 <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted/40 shrink-0">
 {user?.avatar && <Image src={resolveAvatarUrl(user.avatar)} alt="Avatar" fill unoptimized className="object-cover" />}
 </div>
 <div className="space-y-2">
 <input type="file" accept="image/*" className="hidden" id="avatar-input" onChange={handleAvatarChange} />
 <label htmlFor="avatar-input">
 <Button asChild variant="outline" size="sm" disabled={isUploading}>
 <span>{isUploading ? "Uploading…" : "Change avatar"}</span>
 </Button>
 </label>
 <p className="text-[13px] font-medium text-muted-foreground">JPG, PNG or WebP. Max 5MB.</p>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><CardTitle>Cover Photo</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="relative h-40 overflow-hidden">
 {user && (
 <Image
 src={resolveCoverUrl(user.cover)}
 alt="Cover"
 fill
 unoptimized
 className="object-cover"
 />
 )}
 {user && isDefaultCoverValue(user.cover) && (
 <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/50 text-[15px] font-semibold text-muted-foreground">
 No cover photo uploaded yet.
 </div>
 )}
 </div>
 <CoverUpload
 onSuccess={(cover) => {
 if (user) {
 setUser({ ...user, cover });
 }
 }}
 />
 </CardContent>
 </Card>

 {/* Profile info */}
 <Card>
 <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <Label>First name *</Label>
 <Input {...register("first_name")} />
 {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
 </div>
 <div className="space-y-1.5">
 <Label>Last name *</Label>
 <Input {...register("last_name")} />
 {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
 </div>
 </div>
 <div className="space-y-1.5">
 <Label>Username *</Label>
 <Input {...register("username")} />
 {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
 </div>
 <div className="space-y-1.5">
 <Label>Bio</Label>
 <Textarea {...register("about")} rows={3} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <Label>Gender</Label>
 <Select value={watch("gender") ?? ""} onValueChange={(v) => setValue("gender", v)}>
 <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
 <SelectContent>
 <SelectItem value="male">Male</SelectItem>
 <SelectItem value="female">Female</SelectItem>
 <SelectItem value="other">Other</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-1.5">
 <Label>Birthday</Label>
 <Input type="date" {...register("birthday")} />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <Label>Works at</Label>
 <Input {...register("working")} />
 </div>
 <div className="space-y-1.5">
 <Label>Studied at</Label>
 <Input {...register("school")} />
 </div>
 </div>
 <div className="space-y-1.5">
 <Label>Work link</Label>
 <Input {...register("working_link")} type="url" placeholder="https://company.example.com" />
 {errors.working_link && <p className="text-xs text-destructive">{errors.working_link.message}</p>}
 </div>
 <div className="space-y-1.5">
 <Label>Location</Label>
 <PlacesAutocomplete
 value={watch("location") ?? ""}
 onChange={(v) => setValue("location", v, { shouldDirty: true })}
 placeholder="City, Country"
 />
 </div>
 <div className="space-y-1.5">
 <Label>Website</Label>
 <Input {...register("website")} type="url" placeholder="https://example.com" />
 {errors.website && <p className="text-xs text-destructive">{errors.website.message}</p>}
 </div>
 <Button type="submit" disabled={isSubmitting}>
 {isSubmitting ? "Saving…" : "Save profile"}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
