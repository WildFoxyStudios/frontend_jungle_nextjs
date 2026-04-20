"use client";

import { useEffect, useState } from "react";
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
  Label, Input, Textarea, Separator
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

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await commerceApi.getFunding();
      setCampaigns(res.data || []);
    } catch {
      toast.error(t("errorLoading"));
    } finally {
      setLoading(false);
    }
  };

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
    loadData();
  }, [t]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("desc")}
          </p>
        </div>
        <CreateFundingDialog onCreated={loadData} />
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="explore">{t("explore")}</TabsTrigger>
          <TabsTrigger value="my" onClick={() => myCampaigns.length === 0 && loadMy()}>{t("myRequests")}</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-[400px] w-full rounded-2xl" />)}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-xl font-bold">{t("noCampaigns")}</h3>
              <p className="text-muted-foreground">{t("noCampaignsDesc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="group overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 rounded-3xl border-border/50">
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={resolveMediaUrl(campaign.cover)} 
                      alt={campaign.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/90 text-black backdrop-blur-sm border-none shadow-sm capitalize px-3 py-1 font-bold">
                        {t("community")}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar className="h-6 w-6 ring-2 ring-background">
                        <AvatarImage src={resolveAvatarUrl(campaign.creator?.avatar)} />
                        <AvatarFallback>{campaign.creator?.first_name?.[0] ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-bold text-muted-foreground hover:text-primary cursor-pointer transition-colors">
                        {t("by", { name: campaign.creator?.first_name ? `${campaign.creator.first_name} ${campaign.creator.last_name || ""}`.trim() : (campaign.creator?.username || "User") })}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-2 text-xl leading-tight group-hover:text-primary transition-colors">
                      {campaign.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-primary">${Number(campaign.raised_amount || 0).toFixed(2)} {t("raised")}</span>
                        <span className="text-muted-foreground opacity-60">${campaign.goal_amount} {t("goal")}</span>
                      </div>
                      <Progress value={(Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100} className="h-2 bg-primary/10" />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button className="w-full h-12 rounded-xl font-bold shadow-sm">{t("donateNow")}</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="pt-6">
          {myLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
            </div>
          ) : myCampaigns.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="text-xl font-bold">No campaigns yet</h3>
              <p className="text-muted-foreground text-sm">Create your first funding campaign to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCampaigns.map((campaign) => (
                <Card key={campaign.id} className="overflow-hidden rounded-2xl">
                  {campaign.cover && (
                    <div className="aspect-video overflow-hidden">
                      <img src={campaign.cover} alt={campaign.title} className="object-cover w-full h-full" />
                    </div>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold line-clamp-2">{campaign.title}</h3>
                    <Progress value={(Number(campaign.raised_amount || 0) / Number(campaign.goal_amount)) * 100} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>${Number(campaign.raised_amount || 0).toFixed(2)} raised</span>
                      <span>of ${campaign.goal_amount}</span>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/funding/${campaign.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
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
    const [form, setForm] = useState({
        title: "",
        amount: "",
        description: ""
    });
    const t = useTranslations("funding");

    const handleCreate = async () => {
        if (!form.title || !form.amount || !form.description) return toast.error(t("fillRequired"));
        setLoading(true);
        try {
            await commerceApi.createFunding({
                title: form.title,
                goal_amount: parseFloat(form.amount),
                description: form.description
            });
            toast.success(t("success"));
            setOpen(false);
            onCreated();
        } catch (err) {
            toast.error(t("error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="lg" className="h-12 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2">
                    <Plus className="h-5 w-5" /> {t("createFunding")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">{t("startCampaign")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-6 font-sans">
                    <div className="space-y-2">
                        <Label htmlFor="title" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t("campaignTitle")}</Label>
                        <Input 
                            id="title" 
                            className="h-12 rounded-xl"
                            placeholder="Help for..." 
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t("goalAmount")}</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            className="h-12 rounded-xl"
                            placeholder="1000.00" 
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc" className="font-bold text-xs uppercase tracking-widest text-muted-foreground">{t("storyDesc")}</Label>
                        <Textarea 
                            id="desc" 
                            rows={4}
                            placeholder="Describe your cause..." 
                            className="resize-none rounded-xl"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                </div>
                <Button onClick={handleCreate} disabled={loading} className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">
                    {loading ? t("creating") : t("launchCampaign")}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
