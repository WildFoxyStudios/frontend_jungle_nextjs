"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { toast } from "sonner";
import { Users, FileText, TrendingUp, Eye } from "lucide-react";

interface Props { params: Promise<{ slug: string }> }

interface GroupStats {
  member_count?: number;
  post_count?: number;
  view_count?: number;
  growth_this_week?: number;
}

export default function GroupAnalyticsPage({ params }: Props) {
  const { slug } = use(params);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groupsApi.getGroup(slug)
      .then((g) => setGroup(g))
      .catch(() => toast.error("Failed to load group"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!group) return <p className="text-muted-foreground">Group not found.</p>;

  const stats = group as Group & GroupStats;

  const metrics = [
    { label: "Total Members", value: stats.member_count?.toLocaleString() ?? "—", icon: Users },
    { label: "Total Posts", value: stats.post_count?.toLocaleString() ?? "—", icon: FileText },
    { label: "Profile Views", value: stats.view_count?.toLocaleString() ?? "—", icon: Eye },
    { label: "Growth This Week", value: stats.growth_this_week != null ? `+${stats.growth_this_week}` : "—", icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Group Analytics</h2>

      <div className="grid grid-cols-2 gap-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground font-normal">
                <Icon className="h-4 w-4" /> {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Detailed time-series charts will appear here once the group has sufficient activity.
        </CardContent>
      </Card>
    </div>
  );
}
