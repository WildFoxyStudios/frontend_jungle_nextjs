"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usersApi, paymentsApi } from "@jungle/api-client";
import type { ProPlan } from "@jungle/api-client";
import { Button, Skeleton } from "@jungle/ui";
import { Sparkles, Star, Zap, Rocket, Crown, Check } from "lucide-react";

const PLAN_ICONS: Record<number, React.ReactNode> = {
  1: <Star className="h-16 w-16 text-green-500" />,
  2: <Zap className="h-16 w-16 text-orange-500" />,
  3: <Rocket className="h-16 w-16 text-red-500" />,
  4: <Crown className="h-16 w-16 text-blue-500" />,
};

export default function UpgradedPage() {
  const [plan, setPlan] = useState<ProPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      usersApi.getMe().catch(() => null),
      paymentsApi.getProPlans().catch(() => []),
    ]).then(([user, plans]) => {
      const u = user as { is_pro?: number; pro_type?: number } | null;
      if (u && u.pro_type) {
        const match = (plans as ProPlan[]).find((p) => p.id === u.pro_type);
        if (match) setPlan(match);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-64 w-full max-w-lg mx-auto mt-8" />;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-6">
      {/* Decorative background blobs */}
      <div className="relative">
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-4 left-1/4 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-4 right-1/4 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Icon */}
        <div className="relative flex justify-center mb-4">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-6 ring-4 ring-primary/10">
            {plan ? (PLAN_ICONS[plan.id] ?? <Sparkles className="h-16 w-16 text-primary" />) : (
              <Sparkles className="h-16 w-16 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Congratulations */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Sparkles className="h-4 w-4" />
          <span>Congratulations!</span>
          <Sparkles className="h-4 w-4" />
        </div>
        <h1 className="text-3xl font-bold">
          You are now{" "}
          <span className="text-primary">{plan?.name ?? "Pro"}</span>!
        </h1>
        <p className="text-muted-foreground">
          Welcome to the premium experience. Enjoy all the exclusive features.
        </p>
      </div>

      {/* Plan features */}
      {plan?.features && plan.features.length > 0 && (
        <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-center mb-3">What you unlocked:</p>
          {plan.features.slice(0, 6).map((f: string, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button asChild size="lg" className="gap-2">
          <Link href="/feed">
            <Sparkles className="h-4 w-4" /> Start Exploring
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/settings/profile">Edit Profile</Link>
        </Button>
      </div>
    </div>
  );
}
