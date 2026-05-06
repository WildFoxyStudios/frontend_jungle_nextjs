"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { commerceApi, paymentsApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import {
 Button, Card, CardContent, CardHeader, CardTitle, GatewaySelect, Label, Skeleton, Separator,
} from "@jungle/ui";
import { toast } from "sonner";

interface Props { params: Promise<{ orderId: string }> }

export default function CheckoutPaymentPage({ params }: Props) {
 const { orderId } = use(params);
 const router = useRouter();
 const t = useTranslations("checkout");
 const [order, setOrder] = useState<Order | null>(null);
 const [gateway, setGateway] = useState<string>("stripe");
 const [isProcessing, setIsProcessing] = useState(false);
 const [loadingOrder, setLoadingOrder] = useState(true);

 useEffect(() => {
 commerceApi.getOrder(Number(orderId))
 .then(setOrder)
 .catch((err) =>
 toast.error(
 err instanceof Error ? err.message : t("orderLoadFailed"),
 ),
 )
 .finally(() => setLoadingOrder(false));
 }, [orderId, t]);

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
 toast.success(t("paymentSucceeded"));
 router.push(`/orders/${order.id}`);
 }
 } catch (err) {
 toast.error(err instanceof Error ? err.message : t("paymentFailed"));
 } finally {
 setIsProcessing(false);
 }
 };

 if (loadingOrder) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
 <Skeleton className="h-48 w-full" />
 </div>
 );
 }

 if (!order) {
 return (
 <div className="max-w-2xl mx-auto px-4 py-8 text-center text-muted-foreground">
 {t("orderNotFound")}
 </div>
 );
 }

 const amountStr = Number(order.total).toFixed(2);

 return (
 <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
 <Card>
 <CardHeader>
 <CardTitle>{t("orderPayHeading", { id: order.id })}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4">
 {order.product && (
 <div className="flex gap-3 text-sm">
 <div className="flex-1">
 <p className="font-semibold">{order.product.title}</p>
 <p className="text-xs text-muted-foreground">
 {t("quantityShort", { qty: order.quantity })}
 </p>
 </div>
 <p className="font-semibold">
 {order.currency} {amountStr}
 </p>
 </div>
 )}
 <Separator />
 <div className="space-y-1.5">
 <Label>{t("paymentMethod")}</Label>
 <GatewaySelect value={gateway} onValueChange={setGateway} />
 </div>
 <Button
 className="w-full"
 disabled={!gateway || isProcessing}
 onClick={handlePay}
 >
 {isProcessing
 ? t("payRedirecting")
 : t("payAmountCta", {
 currency: order.currency,
 amount: amountStr,
 })}
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
