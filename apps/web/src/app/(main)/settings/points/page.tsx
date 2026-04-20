"use client";

import { useEffect, useState } from "react";
import { usersApi } from "@jungle/api-client";
import type { User } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from "@jungle/ui";
import { Star } from "lucide-react";

export default function PointsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi.getMe()
      .then(setUser)
      .catch(() => { /* non-critical: failure is silent */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;

  const points = (user as { points?: number })?.points ?? 0;
  const wallet = (user as { wallet?: number })?.wallet ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" /> Points Balance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-yellow-500">{points.toLocaleString()}</div>
          <p className="text-sm text-muted-foreground">Points</p>

          {wallet > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Points wallet value</p>
              <p className="text-2xl font-semibold">${wallet.toFixed(2)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How to Earn Points</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { action: "Create a post", points: "Points per post" },
            { action: "Like a post", points: "Points per like" },
            { action: "Comment on a post", points: "Points per comment" },
            { action: "Write a blog", points: "Points per blog" },
            { action: "Watch an ad", points: "Points per ad view" },
          ].map(({ action, points: p }) => (
            <div key={action} className="flex items-center justify-between text-sm">
              <span>{action}</span>
              <Badge variant="secondary">{p}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
