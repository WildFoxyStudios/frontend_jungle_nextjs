"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, Skeleton } from "@jungle/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Users, UserPlus, FileText, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 60_000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ["admin", "charts"],
    queryFn: () => adminApi.getDashboardCharts(),
    staleTime: 60_000,
  });

  const userGrowthData = (charts?.user_growth ?? []).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: d.value,
  }));

  const revenueData = (charts?.revenue ?? []).map((d) => ({
    name: new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" }),
    value: d.value,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <StatsCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} />
            <StatsCard title="New Today" value={stats?.new_users_today ?? 0} icon={UserPlus} />
            <StatsCard title="Total Posts" value={stats?.total_posts ?? 0} icon={FileText} />
            <StatsCard title="Total Revenue" value={`$${(stats?.total_revenue ?? 0).toLocaleString()}`} icon={DollarSign} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">User Growth (Last 30 Days)</h2>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ActivityChart data={userGrowthData} type="area" color="#3b82f6" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Revenue Over Time (Last 30 Days)</h2>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <ActivityChart data={revenueData} type="bar" color="#10b981" />
            )}
          </CardContent>
        </Card>
      </div>

      {charts?.top_countries && charts.top_countries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold">Top Countries</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {charts.top_countries.slice(0, 10).map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span>{c.country}</span>
                  <span className="font-medium">{c.count.toLocaleString()} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
