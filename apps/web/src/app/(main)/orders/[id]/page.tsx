"use client";

import { use, useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ id: string }> }

export default function OrderDetailPage({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    commerceApi.getOrder(Number(id))
      .then(setOrder)
      .catch(() => toast.error("Failed to load order"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-48 w-full max-w-2xl mx-auto mt-8" />;
  if (!order) return <p className="text-center mt-8 text-muted-foreground">Order not found.</p>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Order #{order.id}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Order details</CardTitle>
            <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity</span>
            <span>{order.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold">{order.currency} {order.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Placed</span>
            <span>{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}