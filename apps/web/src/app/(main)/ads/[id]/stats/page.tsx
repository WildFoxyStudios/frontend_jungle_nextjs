"use client";

import { use, useEffect, useState } from "react";
import { contentApi } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

interface AdStats {
  impressions: number;
  clicks: number;
  ctr: number;
  daily: { date: string; impressions: number; clicks: number }[];
}

export default function AdStatsPage({ params }: Props) {
  const { id } = use(params);
  const [stats, setStats] = useState<AdStats | null>(null);

  useEffect(() => {
    contentApi.getAdStats(Number(id)).then((data) => {
      const totalImpressions = data.reduce((s, d) => s + d.impressions, 0);
      const totalClicks = data.reduce((s, d) => s + d.clicks, 0);
      setStats({
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        daily: data,
      });
    }).catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load ad stats"));
  }, [id]);

  if (!stats) return <Skeleton className="h-64 w-full max-w-3xl mx-auto mt-4" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Ad Stats</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.impressions}</p><p className="text-xs text-muted-foreground">Impressions</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.clicks}</p><p className="text-xs text-muted-foreground">Clicks</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{stats.ctr?.toFixed(2)}%</p><p className="text-xs text-muted-foreground">CTR</p></CardContent></Card>
      </div>
      {stats.daily && (
        <Card>
          <CardHeader><CardTitle>Performance over time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="#3b82f6" />
                <Line type="monotone" dataKey="clicks" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
