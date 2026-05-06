"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import {
  Users, UserPlus, FileText, DollarSign,
  FileText as Pages, Users2, Circle, MessageCircle, Gamepad2, Mail,
} from "lucide-react";

/** Plan §3.22 AP-A2 — date-range selector options. */
type StatsRange =
  | "today" | "yesterday" | "week" | "month" | "last_month" | "year" | "all";

const RANGE_LABEL: Record<StatsRange, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Last 7 days",
  month: "Last 30 days",
  last_month: "Last 60 days",
  year: "Last 365 days",
  all: "All time",
};

export default function DashboardPage() {
  const [range, setRange] = useState<StatsRange>("all");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 60_000,
  });

  // Plan §3.22 AP-A2 — extended 8-card payload.
  const { data: extended } = useQuery({
    queryKey: ["admin", "stats", "extended", range],
    queryFn: () => adminApi.getExtendedStats({ range }),
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

  // Plan §3.22 AP-A3 — gender split widget. Cheap COUNT(*) GROUP BY gender;
  // kept separate from the extended stats card row so the dashboard keeps
  // rendering even if this widget's query is delayed.
  const { data: genderBuckets } = useQuery({
    queryKey: ["admin", "stats", "gender-breakdown"],
    queryFn: () => adminApi.getGenderBreakdown(),
    staleTime: 5 * 60_000,
  });
  const genderTotal = (genderBuckets ?? []).reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Dashboard</h1>
        <Select value={range} onValueChange={(v) => setRange(v as StatsRange)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(RANGE_LABEL) as StatsRange[]).map((r) => (
              <SelectItem key={r} value={r}>
                {RANGE_LABEL[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Plan §3.22 AP-A2 — 10 stat cards driven by the extended endpoint. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statsLoading || !extended ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))
        ) : (
          <>
            <StatsCard title="New Users Today" value={stats?.new_users_today ?? 0} icon={UserPlus} />
            <StatsCard
              title="Total Revenue"
              value={`$${(stats?.total_revenue ?? 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <StatsCard title="Total Users"    value={extended.total_users}     icon={Users} />
            <StatsCard title="Total Posts"    value={extended.total_posts}     icon={FileText} />
            <StatsCard title="Total Pages"    value={extended.total_pages}     icon={Pages} />
            <StatsCard title="Total Groups"   value={extended.total_groups}    icon={Users2} />
            <StatsCard title="Online Users"   value={extended.online_users}    icon={Circle} />
            <StatsCard title="Total Comments" value={extended.total_comments}  icon={MessageCircle} />
            <StatsCard title="Total Games"    value={extended.total_games}     icon={Gamepad2} />
            <StatsCard title="Total Messages" value={extended.total_messages}  icon={Mail} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-extrabold uppercase tracking-wide">User Growth (Last 30 Days)</h2>
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
            <h2 className="font-extrabold uppercase tracking-wide">Revenue Over Time (Last 30 Days)</h2>
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

      {genderBuckets && genderBuckets.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-extrabold uppercase tracking-wide">Gender breakdown</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {genderBuckets.map((b) => {
                const label = b.gender ?? "Not specified";
                const pct = genderTotal > 0 ? (b.count / genderTotal) * 100 : 0;
                return (
                  <div key={label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-bold">{label}</span>
                      <span className="text-muted-foreground font-bold uppercase tracking-wide text-xs">
                        {b.count.toLocaleString()} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full border bg-secondary/40 overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {charts?.top_countries && charts.top_countries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-extrabold uppercase tracking-wide">Top Countries</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {charts.top_countries.slice(0, 10).map((c) => (
                <div key={c.country} className="flex items-center justify-between text-sm">
                  <span className="font-bold">{c.country}</span>
                  <span className="font-bold uppercase tracking-wide text-xs text-muted-foreground">{c.count.toLocaleString()} users</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
