"use client";

import { use, useEffect, useState } from "react";
import { groupsApi } from "@jungle/api-client";
import type { Group } from "@jungle/api-client";
import {
 Card, CardContent, CardHeader, CardTitle, Skeleton,
} from "@jungle/ui";
import {
 Users, FileText, TrendingUp, MessageCircle, Heart, UserPlus, Clock,
} from "lucide-react";
import {
 AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

interface Props { params: Promise<{ slug: string }> }

/**
 * Plan §3.5 G1 — real group analytics dashboard. Backend response shape
 * comes from `GET /v1/groups/{id}/analytics` (see migration
 * `20260422000011` and `group-page-service::analytics_extras`).
 */
type AnalyticsPayload = Awaited<ReturnType<typeof groupsApi.getAnalytics>>;

export default function GroupAnalyticsPage({ params }: Props) {
 const { slug } = use(params);
 const [group, setGroup] = useState<Group | null>(null);
 const [data, setData] = useState<AnalyticsPayload | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);
 groupsApi
 .getGroup(slug)
 .then(async (g) => {
 if (cancelled) return;
 setGroup(g);
 try {
 const payload = await groupsApi.getAnalytics(g.id);
 if (!cancelled) setData(payload);
 } catch (err) {
 if (!cancelled) {
 toast.error(
 err instanceof Error ? err.message : "Analytics unavailable",
 );
 }
 }
 })
 .catch(() => !cancelled && toast.error("Failed to load group"))
 .finally(() => !cancelled && setLoading(false));
 return () => {
 cancelled = true;
 };
 }, [slug]);

 if (loading) return <Skeleton className="h-80 w-full" />;
 if (!group) {
 return <p className="text-muted-foreground">Group not found.</p>;
 }

 const a = data?.analytics;
 const timeseries = (data?.timeseries ?? []).map((row) => ({
 day: new Date(row.day).toLocaleDateString(undefined, {
 month: "short",
 day: "numeric",
 }),
 count: row.count,
 }));

 const metrics = [
 { label: "Total members", value: a?.total_members ?? 0, icon: Users },
 { label: "New (7d)", value: a?.new_members_last_7d ?? 0, icon: UserPlus, sub: "last 7 days" },
 { label: "New (30d)", value: a?.new_members_last_30d ?? 0, icon: TrendingUp, sub: "last 30 days" },
 { label: "Total posts", value: a?.total_posts ?? 0, icon: FileText },
 { label: "Posts (7d)", value: a?.posts_last_7d ?? 0, icon: FileText, sub: "last 7 days" },
 { label: "Posts (30d)", value: a?.posts_last_30d ?? 0, icon: FileText, sub: "last 30 days" },
 { label: "Reactions", value: a?.total_reactions ?? 0, icon: Heart },
 { label: "Comments", value: a?.total_comments ?? 0, icon: MessageCircle },
 { label: "Pending joins", value: a?.pending_join_requests ?? 0, icon: Clock, sub: "awaiting review" },
 ];

 return (
 <div className="space-y-6">
 <div>
 <h2 className="text-lg font-semibold">{group.name} · Analytics</h2>
 <p className="text-xs text-muted-foreground">
 Admin-only. Updated on page load.
 </p>
 </div>

 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {metrics.map(({ label, value, icon: Icon, sub }) => (
 <Card key={label}>
 <CardHeader className="pb-1">
 <CardTitle className="text-xs flex items-center gap-2 text-muted-foreground font-semibold">
 <Icon className="h-3.5 w-3.5" /> {label}
 </CardTitle>
 </CardHeader>
 <CardContent className="pt-0">
 <p className="text-2xl font-bold">{value.toLocaleString()}</p>
 {sub && (
 <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
 )}
 </CardContent>
 </Card>
 ))}
 </div>

 <Card>
 <CardHeader className="pb-2">
 <CardTitle className="text-sm">Posts · last 14 days</CardTitle>
 </CardHeader>
 <CardContent>
 {timeseries.length === 0 ? (
 <p className="text-sm text-muted-foreground py-8 text-center">
 Not enough data yet.
 </p>
 ) : (
 <ResponsiveContainer width="100%" height={220}>
 <AreaChart data={timeseries}>
 <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
 <XAxis dataKey="day" fontSize={11} />
 <YAxis fontSize={11} width={30} />
 <Tooltip contentStyle={{ fontSize: 12 }} />
 <Area
 type="monotone"
 dataKey="count"
 stroke="#3b82f6"
 fill="#3b82f6"
 fillOpacity={0.2}
 strokeWidth={2}
 />
 </AreaChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>
 </div>
 );
}
