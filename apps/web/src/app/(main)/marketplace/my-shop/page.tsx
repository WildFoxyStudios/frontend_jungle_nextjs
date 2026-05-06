"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import {
 Button, Card, CardContent, CardHeader, CardTitle,
 Skeleton, Badge,
 Tabs, TabsList, TabsTrigger, TabsContent,
} from "@jungle/ui";
import {
 ShoppingBag, Package, DollarSign, Star, Plus, TrendingUp,
} from "lucide-react";
import {
 LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

/**
 * Plan §3.6 MK3 — seller dashboard. The shape mirrors the
 * `/v1/products/me/stats` payload: four KPI cards at the top, a 30-day
 * sparkline, and a lazy-loaded list of the seller's own products.
 */
type SellerStats = {
 products: { total: number; active: number };
 orders: { total: number; pending: number; delivered: number };
 revenue_total: string;
 avg_rating: string | null;
 sparkline: Array<{ day: string; orders: number; revenue: string }>;
};

export default function SellerDashboardPage() {
 const [stats, setStats] = useState<SellerStats | null>(null);
 const [loadingStats, setLoadingStats] = useState(true);
 const [products, setProducts] = useState<Product[]>([]);
 const [loadingProducts, setLoadingProducts] = useState(false);
 const [tab, setTab] = useState<"overview" | "listings">("overview");

 useEffect(() => {
 productsApi
 .getMyStats()
 .then((s) => setStats(s as SellerStats))
 .catch(() => toast.error("Failed to load seller stats"))
 .finally(() => setLoadingStats(false));
 }, []);

 useEffect(() => {
 if (tab !== "listings" || products.length > 0) return;
 setLoadingProducts(true);
 productsApi
 .getMyProducts()
 .then((r) => setProducts(Array.isArray(r?.data) ? r.data : []))
 .catch(() => toast.error("Failed to load your listings"))
 .finally(() => setLoadingProducts(false));
 }, [tab, products.length]);

 // Parse numeric strings from the API once — Recharts and our KPI cards
 // can then treat them as regular numbers without per-row parsing.
 const chartData = (stats?.sparkline ?? []).map((row) => ({
 day: new Date(row.day).toLocaleDateString(undefined, {
 month: "short",
 day: "numeric",
 }),
 orders: row.orders,
 revenue: Number.parseFloat(row.revenue),
 }));

 return (
 <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div>
 <h1 className="text-2xl font-bold flex items-center gap-2">
 <ShoppingBag className="h-6 w-6 text-primary" /> My Shop
 </h1>
 <p className="text-sm text-muted-foreground">
 Track your sales, revenue and product performance.
 </p>
 </div>
 <Button asChild className="gap-2">
 <Link href="/marketplace/create">
 <Plus className="h-4 w-4" /> Add product
 </Link>
 </Button>
 </div>

 {/* KPI cards */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 {loadingStats || !stats ? (
 Array.from({ length: 4 }).map((_, i) => (
 <Skeleton key={i} className="h-24" />
 ))
 ) : (
 <>
 <Kpi
 icon={<Package className="h-4 w-4" />}
 label="Active listings"
 value={`${stats.products.active}`}
 sub={`${stats.products.total} total`}
 />
 <Kpi
 icon={<ShoppingBag className="h-4 w-4" />}
 label="Orders"
 value={`${stats.orders.total}`}
 sub={`${stats.orders.pending} pending · ${stats.orders.delivered} delivered`}
 />
 <Kpi
 icon={<DollarSign className="h-4 w-4" />}
 label="Revenue"
 value={`$${Number.parseFloat(stats.revenue_total).toLocaleString(undefined, {
 maximumFractionDigits: 2,
 })}`}
 sub="all-time"
 />
 <Kpi
 icon={<Star className="h-4 w-4" />}
 label="Avg. rating"
 value={stats.avg_rating
 ? Number.parseFloat(stats.avg_rating).toFixed(2)
 : "—"}
 sub="across reviews"
 />
 </>
 )}
 </div>

 <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
 <TabsList>
 <TabsTrigger value="overview">Overview</TabsTrigger>
 <TabsTrigger value="listings">My listings</TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="mt-4 space-y-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm flex items-center gap-1.5">
 <TrendingUp className="h-4 w-4" /> Last 30 days
 </CardTitle>
 </CardHeader>
 <CardContent>
 {loadingStats ? (
 <Skeleton className="h-48 w-full" />
 ) : chartData.length === 0 ? (
 <p className="text-sm text-muted-foreground py-8 text-center">
 No sales activity yet.
 </p>
 ) : (
 <ResponsiveContainer width="100%" height={240}>
 <LineChart data={chartData}>
 <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
 <XAxis dataKey="day" fontSize={11} />
 <YAxis
 yAxisId="orders"
 orientation="left"
 fontSize={11}
 width={30}
 />
 <YAxis
 yAxisId="revenue"
 orientation="right"
 fontSize={11}
 width={40}
 />
 <Tooltip
 contentStyle={{ fontSize: 12 }}
 labelFormatter={(l) => `${l}`}
 />
 <Line
 yAxisId="orders"
 type="monotone"
 dataKey="orders"
 stroke="#3b82f6"
 strokeWidth={2}
 dot={false}
 name="Orders"
 />
 <Line
 yAxisId="revenue"
 type="monotone"
 dataKey="revenue"
 stroke="#10b981"
 strokeWidth={2}
 dot={false}
 name="Revenue"
 />
 </LineChart>
 </ResponsiveContainer>
 )}
 </CardContent>
 </Card>
 </TabsContent>

 <TabsContent value="listings" className="mt-4">
 {loadingProducts ? (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {Array.from({ length: 6 }).map((_, i) => (
 <Skeleton key={i} className="h-40" />
 ))}
 </div>
 ) : products.length === 0 ? (
 <p className="text-sm text-muted-foreground py-8 text-center">
 You haven&apos;t listed any products yet.
 </p>
 ) : (
 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
 {products.map((p) => (
 <Link
 key={p.id}
 href={`/marketplace/${p.id}`}
 className="group"
 >
 <Card className="overflow-hidden border transition-colors hover:bg-muted/50">
 <div className="relative aspect-square bg-muted">
 {p.images?.[0] && (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={p.images[0].url}
 alt={p.title}
 className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform"
 />
 )}
 {!p.is_available && (
 <Badge
 variant="destructive"
 className="absolute top-2 left-2 text-xs"
 >
 Sold Out
 </Badge>
 )}
 </div>
 <CardContent className="p-3">
 <p className="font-semibold text-sm line-clamp-1">
 {p.title}
 </p>
 <p className="text-sm font-semibold text-primary mt-1">
 {p.currency} {p.price}
 </p>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 )}
 </TabsContent>
 </Tabs>
 </div>
 );
}

function Kpi({
 icon, label, value, sub,
}: {
 icon: React.ReactNode;
 label: string;
 value: string;
 sub?: string;
}) {
 return (
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
 {icon}
 {label}
 </div>
 <p className="text-2xl font-bold mt-1 truncate">{value}</p>
 {sub && (
 <p className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</p>
 )}
 </CardContent>
 </Card>
 );
}
