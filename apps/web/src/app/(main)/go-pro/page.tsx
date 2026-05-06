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
 Crown, ArrowRight, Sparkles, UserCheck, Eye, ShieldCheck, TrendingUp, HardDrive, Flame, type LucideIcon
} from "lucide-react";
import { toast } from "sonner";

export default function GoProPage() {
 const [plans, setPlans] = useState<ProPlan[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedPlan, setSelectedPlan] = useState<ProPlan | null>(null);
 const [gateway, setGateway] = useState<string>("stripe");
 const [subscribing, setSubscribing] = useState(false);
const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
 const t = useTranslations("goPro");

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
 const res = await paymentsApi.subscribePro(selectedPlan.type, period);
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
 <div className="mx-auto max-w-6xl space-y-16 px-3 py-4 sm:px-4">
 <div className="mx-auto max-w-2xl space-y-4 text-center">
 <Badge variant="outline" className="px-4 py-1 text-[13px] font-semibold text-primary">
 {t("reachHeights")}
 </Badge>
 <h1 className="px-1 text-2xl font-bold sm:text-[28px] md:text-5xl">
 {t("upgradeTitle")}
 </h1>
 <p className="text-lg text-muted-foreground">
 {t("upgradeDesc")}
 </p>
 <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[13px] font-medium text-muted-foreground">
 <span className="inline-flex items-center gap-1 bg-muted/40 px-3 py-1 rounded-full"><Shield className="h-3.5 w-3.5" /> Verified tools</span>
 <span className="inline-flex items-center gap-1 bg-muted/40 px-3 py-1 rounded-full"><Rocket className="h-3.5 w-3.5" /> More reach</span>
 <span className="inline-flex items-center gap-1 bg-muted/40 px-3 py-1 rounded-full"><Sparkles className="h-3.5 w-3.5" /> Premium profile</span>
 <span className="inline-flex items-center gap-1 bg-muted/40 px-3 py-1 rounded-full"><UserCheck className="h-3.5 w-3.5" /> Priority visibility</span>
 </div>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
 {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[450px] w-full" />)}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 {plans.map((plan) => (
 <ProCard
 key={plan.type}
 plan={plan}
 onSubscribe={() => setSelectedPlan(plan)}
 />
 ))}
 </div>
 )}

 <div className="space-y-12">
 <div className="space-y-2 text-center">
 <h2 className="text-2xl font-bold sm:text-[28px]">{t("whyPro")}</h2>
 <p className="font-medium text-muted-foreground">{t("compareBenefits")}</p>
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
 <div className="bg-muted/40 p-3 text-sm">
 <div className="flex items-baseline justify-between">
 <span className="font-semibold">{selectedPlan.name}</span>
 <span className="text-2xl font-semibold">${period === "monthly" ? selectedPlan.monthly_price : selectedPlan.yearly_price}<span className="text-[13px] font-medium text-muted-foreground">/{period}</span></span>
 </div>
 </div>
 )}
 <div className="space-y-1.5">
 <Label>Payment method</Label>
 <GatewaySelect value={gateway} onValueChange={setGateway} />
</div>
<div className="space-y-1.5">
<Label>Billing period</Label>
<div className="flex gap-2">
<Button size="sm" variant={period === "monthly" ? "default" : "outline"} onClick={() => setPeriod("monthly")}>Monthly</Button>
<Button size="sm" variant={period === "yearly" ? "default" : "outline"} onClick={() => setPeriod("yearly")}>Yearly</Button>
</div>
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
 <Card className={`relative flex h-full flex-col overflow-hidden border p-4 transition hover:bg-muted/50 ${isPremium ? "border-foreground bg-primary/10 shadow-md" : "border-foreground bg-card hover:shadow-md"}`}>
 {isPremium && (
 <div className="absolute right-0 top-0">
 <Badge className="bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground">
 {t("bestValue")}
 </Badge>
 </div>
 )}
 {isVip && !isPremium && (
 <div className="absolute left-4 top-4">
 <Badge variant="secondary" className="gap-1.5">
 <Sparkles className="h-3.5 w-3.5" /> VIP
 </Badge>
 </div>
 )}

 <CardHeader className="space-y-4 pt-4 text-center">
 <div className="mx-auto mb-2 w-fit bg-muted/40 p-4">
 {getTierIcon()}
 </div>
 <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
 <div className="flex items-baseline justify-center gap-1">
 <span className="text-4xl font-semibold">${plan.monthly_price}</span>
 <span className="text-sm font-medium text-muted-foreground">/mo</span>
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
 className={`h-14 w-full font-semibold ${isPremium ? "" : "bg-secondary text-foreground hover:bg-secondary/80 hover:text-foreground"}`}
 onClick={onSubscribe}
 >
 {t("upgradeNow")} <ArrowRight className="ml-2 h-4 w-4" />
 </Button>
 </div>
 </Card>
 );
}

function Benefit({ icon: Icon, text, active }: { icon: LucideIcon; text: string; active: boolean }) {
 return (
 <li className={`flex items-center gap-3 text-sm ${active ? "text-foreground" : "text-muted-foreground/40 line-through grayscale"}`}>
 <div className={`flex h-6 w-6 shrink-0 items-center justify-center ${active ? "bg-success text-success-foreground" : "bg-secondary/60 text-muted-foreground"}`}>
 <Icon className="h-3 w-3" strokeWidth={3} />
 </div>
 <span className="font-medium">{text}</span>
 </li>
 );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
 return (
 <Card className="group transition hover:bg-muted/50">
 <CardContent className="space-y-4 p-8 text-center md:text-left">
 <div className="mx-auto flex h-16 w-16 items-center justify-center border bg-background text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground md:mx-0">
 <Icon className="h-8 w-8" strokeWidth={1.5} />
 </div>
 <div className="space-y-2">
 <h3 className="text-xl font-semibold">{title}</h3>
 <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
 </div>
 </CardContent>
 </Card>
 );
}
