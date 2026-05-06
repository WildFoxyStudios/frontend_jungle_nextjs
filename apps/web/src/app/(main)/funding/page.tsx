"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { commerceApi } from "@jungle/api-client";
import { resolveMediaUrl } from "@/lib/media";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { Funding } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
 Card, CardContent, CardHeader, CardTitle, CardFooter,
 Button, Progress, Badge, Skeleton, Avatar, AvatarImage, AvatarFallback,
 ConfirmDialog,
 Tabs, TabsContent, TabsList, TabsTrigger,
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
 Label, Input, Textarea
} from "@jungle/ui";
import {
 Heart, Plus, Pencil, Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function FundingPage() {
 const [campaigns, setCampaigns] = useState<Funding[]>([]);
 const [myCampaigns, setMyCampaigns] = useState<Funding[]>([]);
 const [loading, setLoading] = useState(true);
 const [myLoading, setMyLoading] = useState(false);
 const [pendingDelete, setPendingDelete] = useState<Funding | null>(null);
 const t = useTranslations("funding");

 const loadData = useCallback(async () => {
 setLoading(true);
 try {
 const res = await commerceApi.getFunding();
 setCampaigns(res.data || []);
 } catch {
 toast.error(t("errorLoading"));
 } finally {
 setLoading(false);
 }
 }, [t]);

 const loadMy = async () => {
 setMyLoading(true);
 try {
 const res = await commerceApi.getMyFundings();
 setMyCampaigns(res.data || []);
 } catch {
 /* silent */
 } finally {
 setMyLoading(false);
 }
 };

 const confirmDelete = async () => {
 if (!pendingDelete) return;
 const id = pendingDelete.id;
 try {
 await commerceApi.deleteFunding(id);
 setMyCampaigns((p) => p.filter((c) => c.id !== id));
 toast.success("Campaign deleted");
 } catch {
 toast.error("Failed to delete");
 }
 };

 useEffect(() => {
 void loadData();
 }, [loadData]);

 return (
 <div className="mx-auto max-w-6xl space-y-8 px-3 py-4 sm:px-4">
 <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
 <div>
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
 <p className="font-medium text-muted-foreground">
 {t("desc")}
 </p>
 </div>
 <CreateFundingDialog onCreated={loadData} />
 </div>

 <Tabs defaultValue="explore" className="w-full">
 <TabsList className="bg-secondary/40 p-1">
 <TabsTrigger value="explore">{t("explore")}</TabsTrigger>
 <TabsTrigger value="my" onClick={() => myCampaigns.length === 0 && loadMy()}>{t("myRequests")}</TabsTrigger>
 </TabsList>

 <TabsContent value="explore" className="pt-6">
 {loading ? (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
 {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] w-full" />)}
 </div>
 ) : campaigns.length === 0 ? (
 <div className="py-12 text-center">
 <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
 <h3 className="text-xl font-semibold">{t("noCampaigns")}</h3>
 <p className="mt-1 text-[15px] font-semibold text-muted-foreground">{t("noCampaignsDesc")}</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
 {campaigns.map((campaign) => (
 <Card key={campaign.id} className="group flex flex-col overflow-hidden transition-colors duration-300 hover:bg-muted/50">
 <div className="relative aspect-video overflow-hidden border-b bg-muted flex items-center justify-center">
 {resolveMediaUrl(campaign.cover) ? (
 <Image
 src={resolveMediaUrl(campaign.cover)}
 alt={campaign.title}
 fill
 unoptimized
 className="object-cover transition-transform duration-500 group-hover:scale-110"
 />
 ) : (
 <Heart className="h-10 w-10 text-muted-foreground opacity-30" />
 )}
 <div className="absolute left-4 top-4">
 <Badge className="px-3 py-1 font-medium text-foreground">
 {t("community")}
 </Badge>
 </div>
 </div>

 <CardHeader className="flex-1 pb-4">
 <div className="mb-3 flex items-center gap-2">
 <Avatar className="h-6 w-6 ring-2 ring-background">
 <AvatarImage src={resolveAvatarUrl(campaign.creator?.avatar)} />
 <AvatarFallback>{campaign.creator?.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <span className="cursor-pointer text-[13px] font-medium text-muted-foreground transition-colors hover:text-primary">
 {t("by", { name: campaign.creator?.first_name ? `${campaign.creator.first_name} ${campaign.creator.last_name || ""}`.trim() : (campaign.creator?.username || "User") })}
 </span>
 </div>
 <CardTitle className="line-clamp-2 text-xl font-semibold leading-tight transition-colors group-hover:text-primary">
 {campaign.title}
 </CardTitle>
 </CardHeader>

 <CardContent className="space-y-4">
 <div className="space-y-2">
 <div className="flex justify-between text-sm font-semibold">
 <span className="px-2 py-0.5 font-semibold text-primary">${Number(campaign.raised_amount || 0).toFixed(2)} {t("raised")}</span>
 <span className="font-medium text-muted-foreground">${campaign.goal_amount} {t("goal")}</span>
 </div>
 <Progress value={(Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100} className="h-2 bg-muted" />
 </div>
 </CardContent>

 <CardFooter className="px-6 pb-6 pt-0">
 <Button className="h-12 w-full font-semibold">{t("donateNow")}</Button>
 </CardFooter>
 </Card>
 ))}
 </div>
 )}
 </TabsContent>

 <TabsContent value="my" className="pt-6">
 {myLoading ? (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
 {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
 </div>
 ) : myCampaigns.length === 0 ? (
 <div className="py-12 text-center">
 <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
 <h3 className="text-xl font-semibold">No campaigns yet</h3>
 <p className="mt-1 text-[15px] font-semibold text-muted-foreground">Create your first funding campaign to get started.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
 {myCampaigns.map((campaign) => (
 <Card key={campaign.id} className="overflow-hidden">
 <div className="aspect-video overflow-hidden border-b bg-muted flex items-center justify-center">
 {resolveMediaUrl(campaign.cover) ? (
 <Image 
 src={resolveMediaUrl(campaign.cover)} 
 alt={campaign.title} 
 width={1200} 
 height={675} 
 unoptimized 
 className="h-full w-full object-cover" 
 />
 ) : (
 <Heart className="h-10 w-10 text-muted-foreground opacity-30" />
 )}
 </div>
 <CardContent className="space-y-3 p-4">
 <h3 className="line-clamp-2 font-semibold">{campaign.title}</h3>
 <Progress value={(Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100} className="h-1.5 bg-muted" />
 <div className="flex justify-between text-[13px] font-medium text-muted-foreground">
 <span>${Number(campaign.raised_amount || 0).toFixed(2)} raised</span>
 <span>of ${campaign.goal_amount}</span>
 </div>
 <div className="flex gap-2">
 <Link href={`/funding/${campaign.id}/edit`} className="flex-1">
 <Button variant="outline" size="sm" className="w-full">
 <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
 </Button>
 </Link>
 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setPendingDelete(campaign)}>
 <Trash2 className="h-3.5 w-3.5" />
 </Button>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </TabsContent>
 </Tabs>

 <ConfirmDialog
 open={pendingDelete !== null}
 onOpenChange={(o) => { if (!o) setPendingDelete(null); }}
 title="Delete this campaign?"
 description={pendingDelete ? `"${pendingDelete.title}" and all donations tied to it will stop being collected. This cannot be undone.` : undefined}
 variant="destructive"
 confirmText="Delete campaign"
 onConfirm={confirmDelete}
 />
 </div>
 );
}

function CreateFundingDialog({ onCreated }: { onCreated: () => void }) {
 const [open, setOpen] = useState(false);
 const [loading, setLoading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [form, setForm] = useState({
 title: "",
 amount: "",
 description: ""
 });
 const [coverFile, setCoverFile] = useState<File | null>(null);
 const [coverPreview, setCoverPreview] = useState("");
 const t = useTranslations("funding");

 const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setCoverFile(file);
 setCoverPreview(URL.createObjectURL(file));
 };

 const handleCreate = async () => {
 if (!form.title || !form.amount || !form.description) return toast.error(t("fillRequired"));
 setLoading(true);
 try {
 let coverUrl = undefined;
 if (coverFile) {
 const fd = new FormData();
 fd.append("file", coverFile);
 fd.append("type", "funding_cover");
 const { mediaApi } = await import("@jungle/api-client");
 const uploaded = await mediaApi.uploadMedia(fd, (pct) => setUploadProgress(pct));
 coverUrl = uploaded.url;
 }

 await commerceApi.createFunding({
 title: form.title,
 goal_amount: parseFloat(form.amount),
 description: form.description,
 ...(coverUrl && { cover: coverUrl })
 });
 toast.success(t("success"));
 setOpen(false);
 setForm({ title: "", amount: "", description: "" });
 setCoverFile(null);
 setCoverPreview("");
 onCreated();
 } catch {
 toast.error(t("error"));
 } finally {
 setLoading(false);
 setUploadProgress(0);
 }
 };

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger asChild>
 <Button size="lg" className="h-12 gap-2 px-8 font-semibold">
 <Plus className="h-5 w-5" /> {t("createFunding")}
 </Button>
 </DialogTrigger>
 <DialogContent className="sm:max-w-[500px]">
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold">{t("startCampaign")}</DialogTitle>
 </DialogHeader>
 <div className="grid gap-6 py-6 font-sans">
 <div className="space-y-1.5">
 <Label className="text-[13px] font-medium text-muted-foreground">Cover Image</Label>
 <div
 className="group relative h-32 sm:h-40 cursor-pointer overflow-hidden border bg-muted flex items-center justify-center"
 onClick={() => document.getElementById("create-cover-upload")?.click()}
 >
 {coverPreview ? (
 <Image src={coverPreview} alt="" fill unoptimized className="object-cover" />
 ) : (
 <div className="flex flex-col items-center justify-center text-muted-foreground">
 <Plus className="h-8 w-8 mb-1" />
 <span className="text-[13px] font-medium">Upload Image</span>
 </div>
 )}
 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
 <span className="text-white opacity-0 group-hover:opacity-100 text-[15px] font-semibold">Change Image</span>
 </div>
 </div>
 <input id="create-cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
 {uploadProgress > 0 && uploadProgress < 100 && (
 <Progress value={uploadProgress} className="h-1 mt-2" />
 )}
 </div>
 <div className="space-y-2">
 <Label htmlFor="title" className="text-[13px] font-medium text-muted-foreground">{t("campaignTitle")}</Label>
 <Input
 id="title"
 className="h-12"
 placeholder="Help for..."
 value={form.title}
 onChange={(e) => setForm({ ...form, title: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="amount" className="text-[13px] font-medium text-muted-foreground">{t("goalAmount")}</Label>
 <Input
 id="amount"
 type="number"
 className="h-12"
 placeholder="1000.00"
 value={form.amount}
 onChange={(e) => setForm({ ...form, amount: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="desc" className="text-[13px] font-medium text-muted-foreground">{t("storyDesc")}</Label>
 <Textarea
 id="desc"
 rows={4}
 placeholder="Describe your cause..."
 className="resize-none"
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 />
 </div>
 </div>
 <Button onClick={handleCreate} disabled={loading} className="h-14 w-full text-lg font-semibold">
 {loading ? t("creating") : t("launchCampaign")}
 </Button>
 </DialogContent>
 </Dialog>
 );
}
