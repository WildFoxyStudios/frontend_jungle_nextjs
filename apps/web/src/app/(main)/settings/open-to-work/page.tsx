"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usersApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Skeleton, Separator, Badge } from "@jungle/ui";
import { BriefcaseBusiness, Wrench, X, Plus } from "lucide-react";
import { toast } from "sonner";

const otwSchema = z.object({
 title: z.string().min(1, "Title is required").max(120),
});

const providingServiceSchema = z.object({
 title: z.string().min(1, "Title is required").max(120),
 description: z.string().max(2000).optional(),
});

type OtwForm = z.infer<typeof otwSchema>;
type PsForm = z.infer<typeof providingServiceSchema>;

export default function OpenToWorkPage() {
 const [loading, setLoading] = useState(true);
 const [openToWork, setOpenToWork] = useState<{ title: string; skills: string[] } | null>(null);
 const [providingService, setProvidingService] = useState<{ title: string; description: string } | null>(null);

 const [otwSkills, setOtwSkills] = useState<string[]>([]);
 const [otwSkillInput, setOtwSkillInput] = useState("");

 const otwForm = useForm<OtwForm>({
 resolver: zodResolver(otwSchema),
 defaultValues: { title: "" },
 });

 const psForm = useForm<PsForm>({
 resolver: zodResolver(providingServiceSchema),
 defaultValues: { title: "", description: "" },
 });

 const {
 register: registerOtw,
 handleSubmit: submitOtw,
 reset: resetOtw,
 formState: { errors: otwErrors, isSubmitting: otwSubmitting },
 } = otwForm;

 const {
 register: registerPs,
 handleSubmit: submitPs,
 reset: resetPs,
 formState: { errors: psErrors, isSubmitting: psSubmitting },
 } = psForm;

 useEffect(() => {
 usersApi
 .getMe()
 .then((u) => {
 const otw = (u as { open_to_work?: { title: string; skills: string[] } | null }).open_to_work;
 const ps = (u as { providing_service?: { title: string; description: string } | null }).providing_service;
 if (otw) {
 setOpenToWork(otw);
 resetOtw({ title: otw.title });
 setOtwSkills(otw.skills ?? []);
 }
 if (ps) {
 setProvidingService(ps);
 resetPs({ title: ps.title, description: ps.description ?? "" });
 }
 })
 .catch(() => {
 /* non-critical: failure is silent */
 })
 .finally(() => setLoading(false));
 }, [resetOtw, resetPs]);

 const addSkill = () => {
 const s = otwSkillInput.trim();
 if (s && !otwSkills.includes(s)) setOtwSkills((prev) => [...prev, s]);
 setOtwSkillInput("");
 };

 const onSaveOtw = submitOtw(async (data) => {
 try {
 await usersApi.setOpenToWork({ title: data.title, skills: otwSkills });
 setOpenToWork({ title: data.title, skills: otwSkills });
 toast.success("Open to Work status saved");
 } catch {
 toast.error("Failed to save");
 }
 });

 const handleRemoveOtw = async () => {
 try {
 await usersApi.unsetOpenToWork();
 setOpenToWork(null);
 resetOtw({ title: "" });
 setOtwSkills([]);
 toast.success("Open to Work removed");
 } catch {
 toast.error("Failed to remove");
 }
 };

 const onSavePs = submitPs(async (data) => {
 try {
 await usersApi.setProvidingService({ title: data.title, description: data.description ?? "" });
 setProvidingService({ title: data.title, description: data.description ?? "" });
 toast.success("Providing Service status saved");
 } catch {
 toast.error("Failed to save");
 }
 });

 const handleRemovePs = async () => {
 try {
 await usersApi.unsetProvidingService();
 setProvidingService(null);
 resetPs({ title: "", description: "" });
 toast.success("Providing Service removed");
 } catch {
 toast.error("Failed to remove");
 }
 };

 if (loading) return <Skeleton className="h-64 w-full" />;

 return (
 <div className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <BriefcaseBusiness className="h-5 w-5 text-green-600" /> Open to Work
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {openToWork && (
 <div className="flex items-start justify-between border bg-success/20 p-3 dark:bg-success/25">
 <div>
 <p className="text-sm font-medium text-foreground">{openToWork.title}</p>
 {openToWork.skills.length > 0 && (
 <div className="mt-1 flex flex-wrap gap-1">
 {openToWork.skills.map((s) => (
 <Badge key={s} variant="secondary" className="text-xs">
 {s}
 </Badge>
 ))}
 </div>
 )}
 </div>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive"
 onClick={handleRemoveOtw}
 disabled={otwSubmitting}
 >
 Remove
 </Button>
 </div>
 )}

 <form onSubmit={onSaveOtw} className="space-y-3">
 <div className="space-y-1.5">
 <Label htmlFor="otw-title">Job Title / Role *</Label>
 <Input
 id="otw-title"
 {...registerOtw("title")}
 placeholder="e.g. Frontend Developer, Product Manager"
 />
 {otwErrors.title && (
 <p className="text-xs text-destructive">{otwErrors.title.message}</p>
 )}
 </div>
 <div className="space-y-1.5">
 <Label>Skills</Label>
 <div className="flex gap-2">
 <Input
 value={otwSkillInput}
 onChange={(e) => setOtwSkillInput(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter") {
 e.preventDefault();
 addSkill();
 }
 }}
 placeholder="Add a skill and press Enter"
 />
 <Button type="button" variant="outline" size="icon" onClick={addSkill}>
 <Plus className="h-4 w-4" />
 </Button>
 </div>
 {otwSkills.length > 0 && (
 <div className="flex flex-wrap gap-1.5 pt-1">
 {otwSkills.map((s) => (
 <Badge key={s} variant="secondary" className="gap-1">
 {s}
 <button type="button" onClick={() => setOtwSkills((prev) => prev.filter((x) => x !== s))}>
 <X className="h-2.5 w-2.5" />
 </button>
 </Badge>
 ))}
 </div>
 )}
 </div>
 <Button type="submit" disabled={otwSubmitting} className="w-full">
 {otwSubmitting ? "Saving…" : openToWork ? "Update Open to Work" : "Enable Open to Work"}
 </Button>
 </form>
 </CardContent>
 </Card>

 <Separator />

 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Wrench className="h-5 w-5 text-blue-600" /> Providing a Service
 </CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {providingService && (
 <div className="flex items-start justify-between border bg-info/20 p-3 dark:bg-info/25">
 <div>
 <p className="text-sm font-medium text-foreground">{providingService.title}</p>
 {providingService.description && (
 <p className="mt-0.5 text-xs text-muted-foreground">{providingService.description}</p>
 )}
 </div>
 <Button
 variant="ghost"
 size="sm"
 className="text-destructive hover:text-destructive"
 onClick={handleRemovePs}
 disabled={psSubmitting}
 >
 Remove
 </Button>
 </div>
 )}

 <form onSubmit={onSavePs} className="space-y-3">
 <div className="space-y-1.5">
 <Label htmlFor="ps-title">Service Title *</Label>
 <Input
 id="ps-title"
 {...registerPs("title")}
 placeholder="e.g. Web Design, Consulting, Tutoring"
 />
 {psErrors.title && (
 <p className="text-xs text-destructive">{psErrors.title.message}</p>
 )}
 </div>
 <div className="space-y-1.5">
 <Label htmlFor="ps-desc">Description</Label>
 <Textarea
 id="ps-desc"
 {...registerPs("description")}
 placeholder="Briefly describe the service you offer…"
 rows={3}
 />
 {psErrors.description && (
 <p className="text-xs text-destructive">{psErrors.description.message}</p>
 )}
 </div>
 <Button type="submit" disabled={psSubmitting} className="w-full">
 {psSubmitting ? "Saving…" : providingService ? "Update Service" : "Enable Providing Service"}
 </Button>
 </form>
 </CardContent>
 </Card>
 </div>
 );
}
