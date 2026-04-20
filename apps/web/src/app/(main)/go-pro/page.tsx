"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { ProPlan } from "@jungle/api-client";
import { useTranslations } from "next-intl";
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Skeleton, Separator,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  GatewaySelect, Label,
} from "@jungle/ui";
import {
  Check, Star, Zap, Shield, Rocket,
  Crown, ArrowRight, Sparkles, UserCheck, Eye, ShieldCheck, TrendingUp, HardDrive, Flame
} from "lucide-react";
import { toast } from "sonner";

export default function GoProPage() {
  const [plans, setPlans] = useState<ProPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ProPlan | null>(null);
  const [gateway, setGateway] = useState<string>("stripe");
  const [subscribing, setSubscribing] = useState(false);
  const t = useTranslations("goPro");
  const tc = useTranslations("common");

  useEffect(() => {
    paymentsApi.getProPlans()
      .then(setPlans)
      .catch(() => toast.error(t("errorLoading")))
      .finally(() => setLoading(false));
  }, [t]);

  const confirmSubscribe = async () => {
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const res = await paymentsApi.subscribePro(selectedPlan.id, gateway);
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        toast.success(t("successMessage"));
        setSelectedPlan(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("failedMessage"));
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge variant="outline" className="px-4 py-1 rounded-full border-primary/30 text-primary font-bold uppercase tracking-widest text-[10px]">
          {t("reachHeights")}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground uppercase italic px-1">
          {t("upgradeTitle")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("upgradeDesc")}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[450px] w-full rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <ProCard
              key={plan.id}
              plan={plan}
              onSubscribe={() => setSelectedPlan(plan)}
            />
          ))}
        </div>
      )}

      <div className="space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">{t("whyPro")}</h2>
          <p className="text-muted-foreground">{t("compareBenefits")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureItem
            icon={Eye}
            title={t("profileVisitors")}
            desc={t("profileVisitorsDesc")}
          />
          <FeatureItem
            icon={ShieldCheck}
            title={t("verifiedBadge")}
            desc={t("verifiedBadgeDesc")}
          />
          <FeatureItem
            icon={TrendingUp}
            title={t("postPromotion")}
            desc={t("postPromotionDesc")}
          />
          <FeatureItem
            icon={Zap}
            title={t("boostedPages")}
            desc={t("boostedPagesDesc")}
          />
          <FeatureItem
            icon={HardDrive}
            title={t("expandedStorage")}
            desc={t("expandedStorageDesc")}
          />
          <FeatureItem
            icon={Star}
            title={t("featuredMember")}
            desc={t("featuredMemberDesc")}
          />
        </div>
      </div>

      <Dialog open={selectedPlan !== null} onOpenChange={(o) => { if (!o) setSelectedPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan ? `Subscribe to ${selectedPlan.name}` : "Subscribe"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            {selectedPlan && (
              <div className="rounded-lg border p-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">{selectedPlan.name}</span>
                  <span className="text-2xl font-bold">${selectedPlan.price}<span className="text-xs text-muted-foreground font-normal">/{selectedPlan.time}</span></span>
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <GatewaySelect value={gateway} onValueChange={setGateway} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedPlan(null)} disabled={subscribing}>Cancel</Button>
            <Button onClick={confirmSubscribe} disabled={subscribing || !gateway}>
              {subscribing ? "Redirecting…" : "Continue to payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProCard({ plan, onSubscribe }: { plan: ProPlan; onSubscribe: () => void }) {
  const t = useTranslations("goPro");
  const isVip = plan.name.toLowerCase().includes("star") || plan.name.toLowerCase().includes("pro") || plan.name.toLowerCase().includes("vip");
  const isPremium = plan.name.toLowerCase().includes("vip") || plan.name.toLowerCase().includes("ultimo");

  const getTierIcon = () => {
    if (plan.name.toLowerCase().includes("vip")) return <Crown className="h-8 w-8 text-yellow-500" />;
    if (plan.name.toLowerCase().includes("ultima")) return <Zap className="h-8 w-8 text-orange-500" />;
    if (plan.name.toLowerCase().includes("hot")) return <Flame className="h-8 w-8 text-red-500" />;
    return <Star className="h-8 w-8 text-primary" />;
  };

  return (
    <Card className={`relative overflow-hidden flex flex-col h-full border-2 transition-all hover:scale-[1.02] rounded-[2.5rem] p-4 ${isPremium ? "border-primary shadow-2xl bg-primary/5" : "border-border shadow-sm"}`}>
      {isPremium && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-2xl px-4 py-1.5 font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground border-none">
            {t("bestValue")}
          </Badge>
        </div>
      )}

      <CardHeader className="text-center space-y-4 pt-4">
        <div className="mx-auto bg-muted/50 rounded-2xl p-4 w-fit mb-2 shadow-inner">
          {getTierIcon()}
        </div>
        <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">{plan.name}</CardTitle>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-black">${plan.price}</span>
          <span className="text-muted-foreground text-sm font-bold uppercase tracking-widest">/{plan.time}</span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 pt-4">
        <Separator className="opacity-50" />
        <ul className="space-y-4">
          <Benefit icon={Check} text={t("featuredMember")} active={!!plan.featured_member} />
          <Benefit icon={Check} text={t("profileVisitors")} active={!!plan.profile_visitors} />
          <Benefit icon={Check} text={t("verifiedBadge")} active={!!plan.verified_badge} />
          {plan.posts_promotion && Number(plan.posts_promotion) > 0 && <Benefit icon={Check} text={t("promotePosts", { count: plan.posts_promotion })} active={true} />}
          {plan.pages_promotion && Number(plan.pages_promotion) > 0 && <Benefit icon={Check} text={t("promotePages", { count: plan.pages_promotion })} active={true} />}
        </ul>
      </CardContent>

      <div className="p-4 pt-0">
        <Button
          className={`w-full h-14 font-black uppercase tracking-widest rounded-3xl shadow-lg shadow-primary/20 transition-all ${isPremium ? "" : "bg-muted text-foreground hover:bg-muted/80 hover:text-foreground"}`}
          onClick={onSubscribe}
        >
          {t("upgradeNow")} <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}

function Benefit({ icon: Icon, text, active }: { icon: any; text: string; active: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${active ? "text-foreground" : "text-muted-foreground/40 line-through grayscale"}`}>
      <div className={`p-1 rounded-full ${active ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
      <span className="font-bold tracking-tight">{text}</span>
    </li>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="border-none shadow-none bg-muted/20 rounded-3xl hover:bg-muted/40 transition-colors group">
      <CardContent className="p-8 space-y-4 text-center md:text-left">
        <div className="mx-auto md:mx-0 h-16 w-16 rounded-[1.25rem] bg-background border-2 border-primary/10 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <Icon className="h-8 w-8" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h3 className="font-black text-xl uppercase tracking-tighter italic">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-medium">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}