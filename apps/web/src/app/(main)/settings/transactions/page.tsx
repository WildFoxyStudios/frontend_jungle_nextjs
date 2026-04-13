"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { paymentsApi } from "@jungle/api-client";
import type { Transaction } from "@jungle/api-client";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton } from "@jungle/ui";
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["transactions", typeFilter],
    queryFn: ({ pageParam }) => paymentsApi.getTransactions(
      pageParam as string | undefined,
      typeFilter !== "all" ? { type: typeFilter } : undefined
    ),
    getNextPageParam: (last) => last.meta.has_more ? last.meta.cursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 60_000,
  });

  const [sentinelRef, isIntersecting] = useIntersection({ threshold: 0, rootMargin: "200px" });
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const transactions = data?.pages.flatMap((p) => p.data as Transaction[]) ?? [];

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

      {isLoading && <Skeleton className="h-48 w-full" />}

      {transactions.length === 0 && !isLoading && (
        <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No transactions yet.</CardContent></Card>
      )}

      <div className="space-y-2">
        {transactions.map((tx) => (
          <Card key={tx.id}>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${["deposit", "refund"].includes(tx.type) ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {["deposit", "refund"].includes(tx.type)
                    ? <ArrowDownLeft className="h-4 w-4" />
                    : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{TYPE_LABELS[tx.type] ?? tx.type}</p>
                  <p className="text-xs text-muted-foreground">{tx.description} · {new Date(tx.created_at).toLocaleDateString()}</p>
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

      {isFetchingNextPage && <Skeleton className="h-16 w-full" />}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
