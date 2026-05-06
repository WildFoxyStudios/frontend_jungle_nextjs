"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, Badge, Button, Skeleton, Alert, AlertTitle } from "@jungle/ui";
import { CheckCircle2, XCircle, RefreshCcw, Terminal } from "lucide-react";

export default function FfmpegProbePage() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "ffmpeg-probe"],
    queryFn: () => adminApi.ffmpegProbe(),
  });

  const probe = data?.data;
  const available = probe?.ok ?? probe?.on_path ?? false;

  return (
    <AdminPageShell
      title="FFmpeg probe"
      description="Detects ffmpeg binary on the server PATH and reports supported codecs for video uploads, live streaming, and transcoding pipelines."
      actions={
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCcw className={`h-4 w-4 mr-1 ${isRefetching ? "animate-spin" : ""}`} />
          Re-run probe
        </Button>
      }
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              {available ? (
                <CheckCircle2 className="h-6 w-6 text-success" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {available ? "ffmpeg detected" : "ffmpeg not found"}
                </p>
                {probe?.version && (
                  <p className="text-xs text-muted-foreground truncate" title={probe.version}>
                    {probe.version}
                  </p>
                )}
                {probe?.error && (
                  <p className="text-xs text-destructive">{probe.error}</p>
                )}
              </div>
              <Badge variant={available ? "default" : "destructive"}>
                {available ? "OK" : "MISSING"}
              </Badge>
            </CardContent>
          </Card>

          {!available && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Install ffmpeg on the server</AlertTitle>
              <p className="text-sm">
                Video uploads, story transcoding and HLS playback require the
                <code className="mx-1 font-mono">ffmpeg</code>
                binary. Install it via your package manager, e.g.
                <code className="mx-1 font-mono">apt install ffmpeg</code>
                or
                <code className="mx-1 font-mono">brew install ffmpeg</code>.
              </p>
            </Alert>
          )}

          {!!probe?.codecs?.length && (
            <Card>
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-medium">Codec support</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {probe.codecs.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between border bg-card px-3 py-2"
                    >
                      <span className="font-mono text-sm">{c.name}</span>
                      {c.available ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </AdminPageShell>
  );
}
