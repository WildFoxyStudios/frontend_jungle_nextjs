"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { CreatorTier } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Button, Avatar, AvatarFallback, AvatarImage, Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";
import Link from "next/link";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<CreatorTier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    paymentsApi.getMySubscriptions()
      .then(setSubscriptions)
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id: number) => {
    try {
      await paymentsApi.unsubscribeFromCreator(id);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Subscription cancelled");
    } catch {
      toast.error("Failed to cancel subscription");
    }
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">My Subscriptions</h1>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">You're not subscribed to any creators yet.</p>
            <Button asChild variant="outline">
              <Link href="/explore">Discover Creators</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        subscriptions.map((sub) => (
          <Card key={sub.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={sub.creator?.avatar} />
                  <AvatarFallback>{sub.creator?.first_name?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{sub.creator?.first_name} {sub.creator?.last_name}</p>
                  <p className="text-sm text-muted-foreground">@{sub.creator?.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{sub.name}</Badge>
                    <span className="text-xs text-muted-foreground">{sub.currency} {sub.price}/mo</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleCancel(sub.id)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
