"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Card, CardContent, CardHeader, Skeleton, Badge } from "@jungle/ui";
import { DollarSign, ClipboardList, Clock, TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  completed: "bg-success",
  pending: "bg-warning",
  failed: "bg-destructive",
  refunded: "bg-info",
};

export default function PaymentsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "payment-stats"],
    queryFn: () => adminApi.getPaymentStats(),
    staleTime: 60_000,
  });

  const revenueData = (stats?.revenue_chart ?? []).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: typeof d.value === "string" ? Number(d.value) : d.value,
  }));

  const currency = stats?.currency ?? "USD";
  const totalRevenue = Number(stats?.total_revenue ?? 0);
  const revenue30d = Number(stats?.revenue_30d ?? 0);

  const statusEntries = Object.entries(stats?.status_counts ?? {});
  const totalStatuses = statusEntries.reduce((sum, [, n]) => sum + Number(n), 0);
  const providers = stats?.top_providers ?? [];
  const maxProviderTotal = providers.reduce((m, p) => Math.max(m, Number(p.total)), 0);

  return (
    <AdminPageShell
      title="Payments Overview"
      description="Revenue, gateway breakdown and transaction state across all configured providers."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatsCard
              title="Total Revenue"
              value={`${currency} ${totalRevenue.toLocaleString()}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Last 30 Days"
              value={`${currency} ${revenue30d.toLocaleString()}`}
              icon={TrendingUp}
            />
            <StatsCard
              title="Transactions"
              value={(stats?.total_transactions ?? 0).toLocaleString()}
              icon={ClipboardList}
            />
            <StatsCard
              title="Pending Withdrawals"
              value={stats?.pending_withdrawals ?? 0}
              icon={Clock}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-extrabold uppercase tracking-wide">Revenue Over Time (Last 30 Days)</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ActivityChart data={revenueData} type="area" color="#10b981" />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-extrabold uppercase tracking-wide">Transactions by status</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : statusEntries.length === 0 ? (
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                No transactions yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {statusEntries.map(([status, count]) => {
                  const n = Number(count);
                  const pct = totalStatuses > 0 ? Math.round((n / totalStatuses) * 100) : 0;
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-bold uppercase tracking-wide">
                          <span className={`inline-block h-2 w-2 ${STATUS_COLORS[status] ?? "bg-muted-foreground"}`} />
                          {status}
                        </span>
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {n} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden border bg-secondary/40">
                        <div
                          className={`h-full ${STATUS_COLORS[status] ?? "bg-foreground"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-extrabold uppercase tracking-wide">Top gateways</h2>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : providers.length === 0 ? (
              <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                No completed transactions yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {providers.map((p) => {
                  const total = Number(p.total);
                  const pct = maxProviderTotal > 0 ? Math.round((total / maxProviderTotal) * 100) : 0;
                  return (
                    <li key={p.provider}>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold capitalize">{p.provider}</span>
                          <Badge variant="secondary">{p.transactions} tx</Badge>
                        </div>
                        <span className="font-mono text-xs font-bold text-muted-foreground">
                          {currency} {total.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden border bg-secondary/40">
                        <div className="h-full bg-success" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}
