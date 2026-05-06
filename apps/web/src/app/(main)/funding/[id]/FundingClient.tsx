"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import type { Funding, PublicUser } from "@jungle/api-client";
import {
 Button, Progress, Skeleton, Card, CardContent, Avatar, AvatarFallback, AvatarImage,
 Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label,
} from "@jungle/ui";
import { PaymentGatewaySelector } from "@/components/payments/PaymentGatewaySelector";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Calendar, Users, Heart, Share2, CheckCircle2, Clock, Pencil } from "lucide-react";

interface Props { id: string }

interface FundingDonation {
 user: PublicUser;
 amount: number;
 created_at: string;
}

export function FundingClient({ id }: Props) {
 const { user } = useAuthStore();
 const [campaign, setCampaign] = useState<Funding | null>(null);
 const [donors, setDonors] = useState<FundingDonation[]>([]);
 const [donateOpen, setDonateOpen] = useState(false);
 const [donateAmount, setDonateAmount] = useState("");
 const [gateway, setGateway] = useState("");
 const [donating, setDonating] = useState(false);

 useEffect(() => {
 commerceApi.getFundingCampaign(Number(id))
 .then(setCampaign)
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load campaign"));
 commerceApi.getDonations(Number(id))
 .then((r) => setDonors(Array.isArray(r?.data) ? (r.data as FundingDonation[]) : []))
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load donations"));
 }, [id]);

 const handleDonate = async () => {
 const amt = Number(donateAmount);
 if (!amt || amt <= 0 || !gateway) {
 toast.error("Enter a valid amount and payment method");
 return;
 }
 setDonating(true);
 try {
 const res = await commerceApi.donateFunding(Number(id), amt, gateway);
 if (res.redirect_url) {
 window.location.href = res.redirect_url;
 } else {
 setCampaign((c) =>
 c ? { ...c, raised_amount: Number(c.raised_amount ?? 0) + amt, donor_count: c.donor_count + 1 } : c,
 );
 toast.success("Thank you for your donation!");
 setDonateOpen(false);
 setDonateAmount("");
 }
 } catch { toast.error("Donation failed"); }
 finally { setDonating(false); }
 };

 const handleShare = async () => {
 try {
 await navigator.clipboard.writeText(window.location.href);
 toast.success("Link copied");
 } catch { /* silent */ }
 };

 if (!campaign || typeof campaign.title !== "string") {
 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <Skeleton className="h-48 w-full" />
 <Skeleton className="h-8 w-2/3" />
 <Skeleton className="h-4 w-1/2" />
 </div>
 );
 }

 const raised = Number(campaign.raised_amount ?? 0);
 const goal = Number(campaign.goal_amount ?? 0);
 const pct = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
 const creator = campaign.creator;
 const isOwner = !!user && !!creator && Number(user.id) === Number(creator.id);
 const endDate = campaign.end_date ? new Date(campaign.end_date) : null;
 const endValid = endDate !== null && !Number.isNaN(endDate.getTime());
 const isEnded = endValid ? endDate! < new Date() : false;
 const daysLeft = endValid
 ? Math.max(0, Math.ceil((endDate!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
 : 0;

 return (
 <div className="mx-auto max-w-2xl space-y-6 px-3 py-4 sm:px-4">
 {/* Owner actions */}
 {isOwner && (
 <div className="flex justify-end">
 <Button asChild variant="outline" size="sm" className="gap-1.5">
 <Link href={`/funding/${id}/edit`}><Pencil className="h-3.5 w-3.5" /> Edit Campaign</Link>
 </Button>
 </div>
 )}
 {/* Cover */}
 {campaign.cover && (
 <div className="relative h-56 overflow-hidden border bg-muted">
 <Image src={campaign.cover} alt={campaign.title} fill priority unoptimized className="object-cover" />
 {campaign.is_goal_reached && (
 <Badge className="absolute right-3 top-3 gap-1" variant="default">
 <CheckCircle2 className="h-3 w-3" /> Goal Reached
 </Badge>
 )}
 </div>
 )}

 {/* Title & Creator */}
 <div className="space-y-3">
 <h1 className="text-2xl font-bold sm:text-[28px]">{campaign.title}</h1>
 {creator?.username ? (
 <Link href={`/profile/${creator.username}`} className="-m-1 flex items-center gap-2 p-1 hover:bg-secondary/60">
 <Avatar className="h-9 w-9">
 <AvatarImage src={resolveAvatarUrl(creator.avatar)} />
 <AvatarFallback>{creator.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-medium">
 {creator.first_name} {creator.last_name}
 </p>
 <p className="text-xs text-muted-foreground">Organizer</p>
 </div>
 </Link>
 ) : (
 <p className="text-sm text-muted-foreground">Organizer</p>
 )}
 </div>

 {/* Progress */}
 <Card>
 <CardContent className="space-y-3 p-4">
 <Progress value={pct} className="h-3 bg-muted" />
 <div className="flex items-baseline justify-between">
 <p className="px-2 py-0.5 text-2xl font-bold text-primary">
 {campaign.currency} {raised.toLocaleString()}
 </p>
 <p className="text-[15px] font-semibold text-muted-foreground">
 of {campaign.currency} {goal.toLocaleString()} goal
 </p>
 </div>
 <div className="flex gap-4 text-sm text-muted-foreground">
 <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {campaign.donor_count} donors</span>
 <span className="flex items-center gap-1">
 <Clock className="h-3.5 w-3.5" />
 {isEnded ? "Ended" : `${daysLeft} days left`}
 </span>
 </div>
 <div className="flex gap-2">
 <Button
 className="flex-1 gap-1.5"
 onClick={() => setDonateOpen(true)}
 disabled={isEnded}
 >
 <Heart className="h-4 w-4" /> Donate
 </Button>
 <Button variant="outline" size="icon" onClick={handleShare} title="Share">
 <Share2 className="h-4 w-4" />
 </Button>
 </div>
 </CardContent>
 </Card>

 {/* Description */}
 {campaign.description && (
 <div className="space-y-2">
 <h2 className="font-semibold">About this campaign</h2>
 <p className="whitespace-pre-wrap text-sm">{campaign.description}</p>
 </div>
 )}

 {/* End date */}
 <div className="flex items-center gap-2 text-sm text-muted-foreground">
 <Calendar className="h-4 w-4" />
 <span>
 {endValid
 ? `Campaign ends ${endDate!.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}`
 : "Campaign timeline"}
 </span>
 </div>

 {/* Donors */}
 {donors.length > 0 && (
 <div className="space-y-3">
 <h2 className="flex items-center gap-2 font-semibold">
 Recent Donors <Badge variant="secondary">{donors.length}</Badge>
 </h2>
 <div className="space-y-2">
 {donors.slice(0, 10).map((d, i) => (
 <div key={i} className="flex items-center gap-2">
 <Avatar className="h-7 w-7">
 <AvatarImage src={resolveAvatarUrl(d.user?.avatar)} />
 <AvatarFallback className="text-xs">{d.user?.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <span className="text-sm flex-1 truncate">{d.user?.first_name} {d.user?.last_name}</span>
 <span className="text-sm font-medium text-primary">{campaign.currency} {d.amount}</span>
 <span className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Donate Dialog */}
 <Dialog open={donateOpen} onOpenChange={setDonateOpen}>
 <DialogContent>
 <DialogHeader><DialogTitle>Donate to {campaign.title}</DialogTitle></DialogHeader>
 <div className="space-y-4 py-2">
 <div className="space-y-1.5">
 <Label>Amount ({campaign.currency})</Label>
 <Input
 type="number"
 step="0.01"
 value={donateAmount}
 onChange={(e) => setDonateAmount(e.target.value)}
 placeholder="0.00"
 />
 </div>
 <div className="flex gap-2">
 {[5, 10, 25, 50, 100].map((amt) => (
 <Button key={amt} variant="outline" size="sm" onClick={() => setDonateAmount(String(amt))}>
 {campaign.currency} {amt}
 </Button>
 ))}
 </div>
 <div className="space-y-1.5">
 <Label>Payment Method</Label>
 <PaymentGatewaySelector selected={gateway} onSelect={setGateway} />
 </div>
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setDonateOpen(false)}>Cancel</Button>
 <Button onClick={handleDonate} disabled={donating || !donateAmount || !gateway}>
 {donating ? "Processing…" : "Donate"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
