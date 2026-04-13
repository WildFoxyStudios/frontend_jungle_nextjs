"use client";
import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { ProPlan } from "@jungle/api-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { Check } from "lucide-react";
import { toast } from "sonner";

export default function GoProPage() {
  const [plans, setPlans] = useState<ProPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<number | null>(null);

  useEffect(() => {
    paymentsApi.getProPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (plan: ProPlan) => {
    setSubscribing(plan.id);
    try {
      const res = await paymentsApi.subscribePro(plan.id, "stripe");
      if (res.redirect_url) { window.location.href = res.redirect_url; }
      else { toast.success("Pro subscription activated!"); }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to subscribe"); }
    finally { setSubscribing(null); }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Go Pro</h1>
        <p className="text-muted-foreground">Unlock premium features and support the platform</p>
      </div>
      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-64" />)}</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.is_popular ? "border-primary shadow-lg" : ""}>
              <CardHeader>
                <CardTitle className="text-center">
                  {plan.name}
                  {plan.is_popular && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Popular</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold">{plan.currency} {plan.price}</span>
                  <span className="text-muted-foreground">/{plan.duration_days === 30 ? "mo" : plan.duration_days === 365 ? "yr" : plan.duration_days + "d"}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => handleSubscribe(plan)} disabled={subscribing === plan.id}>
                  {subscribing === plan.id ? "Processing..." : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
          {plans.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-12">No plans available.</p>}
        </div>
      )}
    </div>
  );
}