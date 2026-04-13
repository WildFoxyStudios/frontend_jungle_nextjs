"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import { Button, Card, CardContent, Progress, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";

export default function FundingPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("funding");

  useEffect(() => {
    commerceApi.getFunding().then((r) => setCampaigns(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild><Link href="/funding/create">{t("createCampaign")}</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {campaigns.map((c) => {
            const pct = Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100));
            return (
              <Card key={c.id}>
                <CardContent className="p-4 space-y-2">
                  <Link href={`/funding/${c.id}`} className="font-semibold hover:underline">{c.title}</Link>
                  <Progress value={pct} className="h-2" />
                  <p className="text-xs text-muted-foreground">{c.raised_amount} / {c.goal_amount} {t("raised")} ({pct}%)</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
