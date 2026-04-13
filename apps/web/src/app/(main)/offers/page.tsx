"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import { Card, CardContent, Skeleton } from "@jungle/ui";

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceApi.getOffers().then((r) => setOffers(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Offers</h1>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <Link href={`/offers/${o.id}`} className="font-semibold hover:underline">{o.title}</Link>
                <p className="text-sm text-muted-foreground">{o.discount_percent}% off</p>
              </CardContent>
            </Card>
          ))}
          {offers.length === 0 && <p className="text-muted-foreground text-sm">No offers available.</p>}
        </div>
      )}
    </div>
  );
}
