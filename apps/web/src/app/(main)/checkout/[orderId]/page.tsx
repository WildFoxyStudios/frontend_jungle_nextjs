"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { commerceApi, paymentsApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import {
  Button, Card, CardContent, CardHeader, CardTitle, GatewaySelect, Label, Skeleton, Separator,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ orderId: string }> }

export default function CheckoutPage({ params }: Props) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [gateway, setGateway] = useState<string>("stripe");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    commerceApi.getOrder(Number(orderId))
      .then(setOrder)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Order not found"))
      .finally(() => setLoadingOrder(false));
  }, [orderId]);

  const handlePay = async () => {
    if (!order || !gateway) return;
    setIsProcessing(true);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await paymentsApi.createPayment({
        provider: gateway,
        amount: Number(order.total),
        currency: order.currency,
        payment_type: "order",
        description: order.product?.title
          ? `Order #${order.id} — ${order.product.title}`
          : `Order #${order.id}`,
        return_url: `${origin}/orders/${order.id}?payment=success`,
        cancel_url: `${origin}/orders/${order.id}?payment=cancelled`,
      });
      if (res.redirect_url) {
        window.location.href = res.redirect_url;
      } else {
        toast.success("Payment completed!");
        router.push(`/orders/${order.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 text-center text-muted-foreground">
        Order not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      <Card>
        <CardHeader><CardTitle>Checkout — Order #{order.id}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {order.product && (
            <div className="flex gap-3 text-sm">
              <div className="flex-1">
                <p className="font-semibold">{order.product.title}</p>
                <p className="text-xs text-muted-foreground">Qty: {order.quantity}</p>
              </div>
              <p className="font-bold">
                {order.currency} {Number(order.total).toFixed(2)}
              </p>
            </div>
          )}
          <Separator />
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <GatewaySelect value={gateway} onValueChange={setGateway} />
          </div>
          <Button
            className="w-full"
            disabled={!gateway || isProcessing}
            onClick={handlePay}
          >
            {isProcessing
              ? "Redirecting\u2026"
              : `Pay ${order.currency} ${Number(order.total).toFixed(2)}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
