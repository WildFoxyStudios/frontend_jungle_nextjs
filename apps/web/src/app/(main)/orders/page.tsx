"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import { Card, CardContent, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceApi.getOrders()
      .then((r) => setOrders(r.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardContent className="p-4">
                <Link href={`/orders/${o.id}`} className="font-semibold hover:underline">Order #{o.id}</Link>
                <p className="text-sm text-muted-foreground">{o.status} · {o.total}</p>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet.</p>}
        </div>
      )}
    </div>
  );
}
