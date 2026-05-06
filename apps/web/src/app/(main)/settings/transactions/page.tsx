"use client";

import { useEffect, useState } from "react";
import { paymentsApi } from "@jungle/api-client";
import type { Transaction } from "@jungle/api-client";
import { Card, CardContent, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
import { useIntersection } from "@jungle/hooks";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
 deposit: "Deposit", withdrawal: "Withdrawal", purchase: "Purchase",
 subscription: "Subscription", transfer: "Transfer", refund: "Refund",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
 completed: "default", pending: "secondary", failed: "destructive", refunded: "outline",
};

export default function TransactionsPage() {
 const [typeFilter, setTypeFilter] = useState<string>("all");
 const [transactions, setTransactions] = useState<Transaction[]>([]);
 const [cursor, setCursor] = useState<string | undefined>(undefined);
 const [hasMore, setHasMore] = useState(true);
 const [loading, setLoading] = useState(true);
 const [loadingMore, setLoadingMore] = useState(false);

 useEffect(() => {
 setTransactions([]);
 setCursor(undefined);
 setHasMore(true);
 let cancelled = false;
 (async () => {
 setLoading(true);
 try {
 const res = await paymentsApi.getTransactions(
 undefined,
 typeFilter !== "all" ? { type: typeFilter } : undefined,
 );
 if (cancelled) return;
 setTransactions((res.data as Transaction[]) ?? []);
 const more = !!res.meta?.has_more;
 setHasMore(more);
 setCursor(more ? res.meta.cursor : undefined);
 } catch {
 if (!cancelled) {
 setTransactions([]);
 setHasMore(false);
 setCursor(undefined);
 }
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [typeFilter]);

 const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });

 useEffect(() => {
 if (!isIntersecting || !hasMore || loadingMore || loading || cursor === undefined) return;
 let cancelled = false;
 (async () => {
 setLoadingMore(true);
 try {
 const res = await paymentsApi.getTransactions(
 cursor,
 typeFilter !== "all" ? { type: typeFilter } : undefined,
 );
 if (cancelled) return;
 const rows = (res.data as Transaction[]) ?? [];
 setTransactions((prev) => [...prev, ...rows]);
 const more = !!res.meta?.has_more;
 setHasMore(more);
 setCursor(more ? res.meta.cursor : undefined);
 } catch {
 if (!cancelled) setHasMore(false);
 } finally {
 if (!cancelled) setLoadingMore(false);
 }
 })();
 return () => {
 cancelled = true;
 };
 }, [isIntersecting, hasMore, loadingMore, loading, cursor, typeFilter]);

 return (
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold">Transaction History</h2>
 <Select value={typeFilter} onValueChange={setTypeFilter}>
 <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All Types</SelectItem>
 {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
 </SelectContent>
 </Select>
 </div>

 {loading && <Skeleton className="h-48 w-full" />}

 {transactions.length === 0 && !loading && (
 <div className="py-12 text-center">
 <p className="text-[15px] font-semibold text-muted-foreground">No transactions yet.</p>
 </div>
 )}

 <div className="space-y-2">
 {transactions.map((tx) => (
 <Card key={tx.id} className="">
 <CardContent className="p-4 flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${["deposit", "refund"].includes(tx.type) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
 {["deposit", "refund"].includes(tx.type)
 ? <ArrowDownLeft className="h-4 w-4" />
 : <ArrowUpRight className="h-4 w-4" />}
 </div>
 <div>
 <p className="text-sm font-semibold">{TYPE_LABELS[tx.type] ?? tx.type}</p>
 <p className="text-[13px] font-medium text-muted-foreground">{tx.description} · {new Date(tx.created_at).toLocaleDateString()}</p>
 </div>
 </div>
 <div className="text-right shrink-0">
 <p className={`font-semibold text-sm ${["deposit", "refund"].includes(tx.type) ? "text-green-600" : "text-red-600"}`}>
 {["deposit", "refund"].includes(tx.type) ? "+" : "-"}{tx.currency} {tx.amount}
 </p>
 <Badge variant={STATUS_VARIANT[tx.status] ?? "secondary"} className="text-xs">{tx.status}</Badge>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {loadingMore && <Skeleton className="h-16 w-full" />}
 <div ref={sentinelRef} className="h-1" />
 </div>
 );
}
