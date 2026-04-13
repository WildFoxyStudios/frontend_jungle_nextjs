"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";

interface Props { params: Promise<{ id: string }> }

export default function AppDetailPage({ params }: Props) {
  const { id } = use(params);
  const [app, setApp] = useState<import("@jungle/api-client").OAuthApp | null>(null);

  useEffect(() => {
    contentApi.getDeveloperApp(Number(id)).then(setApp).catch(() => {});
  }, [id]);

  if (!app) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">{app.name}</h1>
      <Card>
        <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Client ID</p>
            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{app.client_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Client Secret (shown once)</p>
            <p className="font-mono text-sm bg-muted px-2 py-1 rounded">{app.client_secret ?? "••••••••••••••••"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
