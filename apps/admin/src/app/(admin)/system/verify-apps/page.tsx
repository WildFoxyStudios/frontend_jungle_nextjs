"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, Button, Badge, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "Twitter / X" },
  { id: "github", label: "GitHub" },
  { id: "microsoft", label: "Microsoft" },
  { id: "apple", label: "Apple" },
  { id: "discord", label: "Discord" },
] as const;

type ProviderId = typeof PROVIDERS[number]["id"];

interface VerifyResult {
  configured: boolean;
  client_id_present?: boolean;
  client_secret_present?: boolean;
  // Backend may return either snake_case shape; handle both.
  client_id_set?: boolean;
  client_secret_set?: boolean;
  redirect_uri?: string | null;
  error?: string;
}

export default function VerifyAppsPage() {
  const [results, setResults] = useState<Record<string, VerifyResult | null>>({});
  const [pending, setPending] = useState<ProviderId | null>(null);

  const mutation = useMutation({
    mutationFn: async (provider: ProviderId) => {
      const res = await adminApi.verifyOAuthApp(provider);
      return { provider, data: res?.data as VerifyResult };
    },
    onMutate: (provider) => {
      setPending(provider);
    },
    onSuccess: ({ provider, data }) => {
      setResults((r) => ({ ...r, [provider]: data }));
      setPending(null);
      toast.success(`${provider}: probe complete`);
    },
    onError: (err: unknown, provider) => {
      const msg = err instanceof Error ? err.message : "Probe failed";
      setResults((r) => ({ ...r, [provider]: { configured: false, error: msg } }));
      setPending(null);
      toast.error(`${provider}: ${msg}`);
    },
  });

  const verifyAll = async () => {
    for (const p of PROVIDERS) await mutation.mutateAsync(p.id);
  };

  return (
    <AdminPageShell
      title="Verify third-party apps"
      description="Sanity check that OAuth client_id and client_secret are configured for each provider in site_config. Does not perform a live OAuth round-trip."
      actions={
        <Button size="sm" onClick={verifyAll} disabled={!!pending}>
          <ShieldCheck className="h-4 w-4 mr-1" /> Verify all
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const r = results[p.id];
          const idPresent = r?.client_id_present ?? r?.client_id_set ?? false;
          const secretPresent = r?.client_secret_present ?? r?.client_secret_set ?? false;
          return (
            <Card key={p.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{p.label}</p>
                  {r ? (
                    <Badge variant={r.configured ? "default" : "destructive"}>
                      {r.configured ? "Configured" : "Missing keys"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Unknown</Badge>
                  )}
                </div>

                {r ? (
                  <ul className="text-xs space-y-1">
                    <li className="flex items-center gap-2">
                      {idPresent ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      client_id
                    </li>
                    <li className="flex items-center gap-2">
                      {secretPresent ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      client_secret
                    </li>
                    {r.redirect_uri && (
                      <li className="text-muted-foreground truncate" title={r.redirect_uri}>
                        Redirect: <span className="font-mono">{r.redirect_uri}</span>
                      </li>
                    )}
                    {r.error && <li className="text-destructive">{r.error}</li>}
                  </ul>
                ) : pending === p.id ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <p className="text-xs text-muted-foreground">Not yet verified.</p>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => mutation.mutate(p.id)}
                  disabled={pending === p.id}
                  className="w-full"
                >
                  {pending === p.id ? "Verifying…" : "Verify"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminPageShell>
  );
}
