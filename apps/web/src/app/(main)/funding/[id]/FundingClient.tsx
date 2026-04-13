"use client";

import { useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import { Button, Progress, Skeleton } from "@jungle/ui";

interface Props { id: string }

export function FundingClient({ id }: Props) {
  const [campaign, setCampaign] = useState<import("@jungle/api-client").Funding | null>(null);

  useEffect(() => {
    commerceApi.getFundingCampaign(Number(id)).then(setCampaign).catch(() => {});
  }, [id]);

  if (!campaign) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  const pct = Math.min(100, Math.round((campaign.raised_amount / campaign.goal_amount) * 100));

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">{campaign.title}</h1>
      <Progress value={pct} className="h-3" />
      <p className="text-sm text-muted-foreground">{campaign.raised_amount} raised of {campaign.goal_amount} goal ({pct}%)</p>
      {campaign.description && <p className="text-sm">{campaign.description}</p>}
      <Button className="w-full">Donate</Button>
    </div>
  );
}
