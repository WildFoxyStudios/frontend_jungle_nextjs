"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Card, CardContent, CardHeader, Skeleton } from "@jungle/ui";
import { DollarSign, ClipboardList, Clock } from "lucide-react";

export default function PaymentsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "payment-stats"],
    queryFn: () => adminApi.getPaymentStats(),
    staleTime: 60_000,
  });

  const revenueData = (stats?.revenue_chart ?? []).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: d.value,
  }));

  const currency = stats?.currency ?? "USD";

  return (
    <AdminPageShell title="Payments Overview">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : (
          <>
            <StatsCard
              title="Total Revenue"
              value={`${currency} ${(stats?.total_revenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <StatsCard
              title="Transactions"
              value={stats?.total_transactions ?? 0}
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
          <h2 className="font-semibold">Revenue Over Time (Last 30 Days)</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ActivityChart data={revenueData} type="area" color="#10b981" />
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
