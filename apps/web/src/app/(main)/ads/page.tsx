"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { contentApi } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";

export default function AdsPage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getUserAds().then((r) => setAds(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Ads</h1>
        <Button asChild><Link href="/ads/create">Create ad</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-3">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{ad.name}</p>
                  <p className="text-sm text-muted-foreground">{ad.impressions} impressions · {ad.clicks} clicks</p>
                </div>
                <Button variant="outline" size="sm" asChild><Link href={`/ads/${ad.id}/stats`}>Stats</Link></Button>
              </CardContent>
            </Card>
          ))}
          {ads.length === 0 && <p className="text-muted-foreground text-sm">No ads yet.</p>}
        </div>
      )}
    </div>
  );
}
