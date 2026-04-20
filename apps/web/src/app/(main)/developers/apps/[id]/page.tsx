"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { contentApi, type OAuthApp } from "@jungle/api-client";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@jungle/ui";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function AppDetailPage({ params }: Props) {
  const { id } = use(params);
  const [app, setApp] = useState<OAuthApp | null>(null);

  useEffect(() => {
    contentApi
      .getDeveloperApp(Number(id))
      .then(setApp)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load app"));
  }, [id]);

  if (!app) return <Skeleton className="h-64 w-full max-w-2xl mx-auto mt-4" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{app.name}</h1>
        <Button asChild variant="outline" size="sm">
          <Link href={`/developers/apps/${id}/edit`}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Link>
        </Button>
      </div>

      {app.description && (
        <p className="text-sm text-muted-foreground">{app.description}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Client ID</p>
            <p className="font-mono text-sm bg-muted px-2 py-1 rounded break-all">
              {app.client_id}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Client Secret (shown once)</p>
            <p className="font-mono text-sm bg-muted px-2 py-1 rounded break-all">
              {app.client_secret || "••••••••••••••••"}
            </p>
          </div>
          {app.callback_url && (
            <div>
              <p className="text-xs text-muted-foreground">Callback URL</p>
              <p className="font-mono text-sm bg-muted px-2 py-1 rounded break-all">
                {app.callback_url}
              </p>
            </div>
          )}
          {app.website && (
            <div>
              <p className="text-xs text-muted-foreground">Website</p>
              <a
                href={app.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {app.website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
