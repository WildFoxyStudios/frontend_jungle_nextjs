"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import type { Funding, PublicUser } from "@jungle/api-client";
import {
  Button, Progress, Skeleton, Card, CardContent, Avatar, AvatarFallback, AvatarImage,
  Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label,
} from "@jungle/ui";
import { PaymentGatewaySelector } from "@/components/payments/PaymentGatewaySelector";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Calendar, Users, Heart, Share2, CheckCircle2, Clock, Pencil } from "lucide-react";

interface Props { id: string }

export function FundingClient({ id }: Props) {
  const { user } = useAuthStore();
  const [campaign, setCampaign] = useState<Funding | null>(null);
  const [donors, setDonors] = useState<{ user: PublicUser; amount: number; created_at: string }[]>([]);
  const [donateOpen, setDonateOpen] = useState(false);
  const [donateAmount, setDonateAmount] = useState("");
  const [gateway, setGateway] = useState("");
  const [donating, setDonating] = useState(false);

  useEffect(() => {
    commerceApi.getFundingCampaign(Number(id))
      .then(setCampaign)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load campaign"));
    commerceApi.getDonations(Number(id))
      .then((r) => setDonors(Array.isArray(r?.data) ? r.data as any : []))
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
        setCampaign((c) => c ? { ...c, raised_amount: c.raised_amount + amt, donor_count: c.donor_count + 1 } : c);
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

  if (!campaign) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  const pct = campaign.goal_amount > 0 ? Math.min(100, Math.round((campaign.raised_amount / campaign.goal_amount) * 100)) : 0;
  const isOwner = !!user && Number(user.id) === Number(campaign.creator?.id);
  const endDate = new Date(campaign.end_date);
  const isEnded = endDate < new Date();
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
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
        <div className="relative h-56 bg-muted rounded-lg overflow-hidden">
          <img src={campaign.cover} alt={campaign.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          {campaign.is_goal_reached && (
            <Badge className="absolute top-3 right-3 gap-1" variant="default">
              <CheckCircle2 className="h-3 w-3" /> Goal Reached
            </Badge>
          )}
        </div>
      )}

      {/* Title & Creator */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{campaign.title}</h1>
        <Link href={`/profile/${campaign.creator.username}`} className="flex items-center gap-2 hover:bg-muted/50 rounded p-1 -m-1">
          <Avatar className="h-9 w-9">
            <AvatarImage src={resolveAvatarUrl(campaign.creator.avatar)} />
            <AvatarFallback>{campaign.creator.first_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{campaign.creator.first_name} {campaign.creator.last_name}</p>
            <p className="text-xs text-muted-foreground">Organizer</p>
          </div>
        </Link>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Progress value={pct} className="h-3" />
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-bold text-primary">{campaign.currency} {campaign.raised_amount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">of {campaign.currency} {campaign.goal_amount.toLocaleString()} goal</p>
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
          <p className="text-sm whitespace-pre-wrap">{campaign.description}</p>
        </div>
      )}

      {/* End date */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Campaign ends {endDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
      </div>

      {/* Donors */}
      {donors.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
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
