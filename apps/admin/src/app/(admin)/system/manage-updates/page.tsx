"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@jungle/ui";
import { CheckCircle2, Package } from "lucide-react";

type SystemInfo = {
  version?: string;
  database?: { size?: string; tables?: number; version?: string };
  redis?: { version?: string; uptime_seconds?: number; connected?: boolean };
  storage?: Record<string, unknown>;
};

export default function ManageUpdatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "system-info"],
    queryFn: () => adminApi.getSystemInfo() as Promise<{ data: SystemInfo } | SystemInfo>,
    refetchInterval: 60_000,
  });

  // Endpoint returns either { data: {...} } or the object directly depending on
  // handler — normalize.
  const info: SystemInfo = data
    ? "data" in (data as Record<string, unknown>)
      ? (data as { data: SystemInfo }).data
      : (data as SystemInfo)
    : {};

  return (
    <AdminPageShell
      title="Manage updates"
      description="Currently installed backend version and live component status."
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" /> Backend
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Installed version</span>
                <span className="font-mono">{info.version ?? "unknown"}</span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Updates are deployed via CI/CD — consult the release pipeline
                  for newer versions.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">PostgreSQL</span>
                <span className="font-mono text-xs truncate max-w-[60%]">
                  {info.database?.version ?? "unknown"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Redis</span>
                <span className="font-mono text-xs flex items-center gap-2">
                  {info.redis?.version ?? "unknown"}
                  {info.redis?.connected ? (
                    <Badge variant="default" className="h-5">online</Badge>
                  ) : (
                    <Badge variant="destructive" className="h-5">offline</Badge>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DB size</span>
                <span className="font-mono">
                  {info.database?.size ?? "unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tables</span>
                <span className="font-mono">
                  {info.database?.tables ?? "—"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminPageShell>
  );
}
