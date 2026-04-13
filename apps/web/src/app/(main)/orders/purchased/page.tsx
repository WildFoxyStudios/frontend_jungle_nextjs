"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { commerceApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import { Skeleton, Badge } from "@jungle/ui";
import { toast } from "sonner";

export default function PurchasedPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceApi.getOrders()
      .then((r) => setOrders(r.data))
      .catch(() => toast.error("Failed to load purchases"))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) => {
    if (s === "delivered") return "default";
    if (s === "cancelled" || s === "refunded") return "destructive";
    return "secondary";
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">My Purchases</h1>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No purchases yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={"/orders/" + order.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Order #{order.id}</p>
                <p className="text-xs text-muted-foreground">{order.currency} {order.total} · {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={statusColor(order.status) as "default" | "destructive" | "secondary"}>{order.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}