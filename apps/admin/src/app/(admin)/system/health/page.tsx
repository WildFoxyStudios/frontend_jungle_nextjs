"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, Badge } from "@jungle/ui";

export default function SystemHealthPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30_000,
  });

  const services = data ? Object.entries(data) : [];

  return (
    <AdminPageShell title="System Health" description="Real-time status of all backend services.">
      {isLoading ? (
        <p className="text-muted-foreground">Checking services…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(([service, status]) => (
            <Card key={service}>
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium capitalize">{service.replace(/_/g, " ")}</span>
                <Badge variant={status === "ok" || status === true ? "default" : "destructive"}>
                  {String(status)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
