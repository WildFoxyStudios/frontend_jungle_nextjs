"use client";

import { use, useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";

interface Props { params: Promise<{ id: string }> }

export default function OfferDetailPage({ params }: Props) {
  const { id } = use(params);
  const [offer, setOffer] = useState<import("@jungle/api-client").Offer | null>(null);

  useEffect(() => {
    commerceApi.getOffer(Number(id)).then(setOffer).catch(() => {});
  }, [id]);

  if (!offer) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <Card>
        <CardHeader><CardTitle>{offer.title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-primary">{offer.discount_percent}% off</p>
          {offer.description && <p className="text-sm mt-2">{offer.description}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
