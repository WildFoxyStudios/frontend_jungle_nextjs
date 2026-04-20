"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton } from "@jungle/ui";
import { RefreshCw, Database, Server, Activity } from "lucide-react";

interface HealthData {
  status: string;
  checks: { database: boolean; redis: boolean };
  stats: {
    total_users: number;
    total_posts: number;
    active_today: number;
    disk_usage: string;
  };
  uptime: number;
}

interface SystemInfo {
  [key: string]: unknown;
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <Badge variant={ok ? "default" : "destructive"}>
      {ok ? "Online" : "Offline"}
    </Badge>
  );
}

export default function NodePage() {
  const { data: health, isLoading: healthLoading, refetch } = useQuery({
    queryKey: ["admin", "node", "health"],
    queryFn: () => adminApi.getSystemHealth() as unknown as Promise<HealthData>,
    refetchInterval: 30_000,
  });

  const { data: sysInfo, isLoading: sysLoading } = useQuery({
    queryKey: ["admin", "node", "sysinfo"],
    queryFn: () => adminApi.getSystemInfo() as unknown as Promise<SystemInfo>,
    staleTime: 60_000,
  });

  const isLoading = healthLoading || sysLoading;

  return (
    <AdminPageShell
      title="Node Status"
      description="Real-time health and system information for the backend node."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Overall Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={health?.status === "healthy" ? "default" : "destructive"}
                  className="text-sm capitalize"
                >
                  {health?.status ?? "unknown"}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" /> Database
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge ok={health?.checks.database ?? false} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="h-4 w-4" /> Redis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBadge ok={health?.checks.redis ?? false} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: health?.stats.total_users?.toLocaleString() ?? "—" },
              { label: "Total Posts", value: health?.stats.total_posts?.toLocaleString() ?? "—" },
              { label: "Active Today", value: health?.stats.active_today?.toLocaleString() ?? "—" },
              { label: "Disk Usage", value: health?.stats.disk_usage ?? "N/A" },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {sysInfo && Object.keys(sysInfo).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {Object.entries(sysInfo).map(([key, value]) => (
                    <div key={key} className="flex justify-between border-b pb-1 last:border-0">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-medium font-mono text-xs">{String(value)}</span>
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
