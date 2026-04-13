"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { contentApi } from "@jungle/api-client";
import type { OAuthApp } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function DeveloperAppsPage() {
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi.getDeveloperApps()
      .then(setApps)
      .catch(() => toast.error("Failed to load apps"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Apps</h1>
        <Button asChild><Link href="/developers/apps/create">Create app</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{app.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{app.client_id}</p>
                </div>
                <Button variant="outline" size="sm" asChild><Link href={`/developers/apps/${app.id}`}>Manage</Link></Button>
              </CardContent>
            </Card>
          ))}
          {apps.length === 0 && <p className="text-muted-foreground text-sm">No apps yet.</p>}
        </div>
      )}
    </div>
  );
}
