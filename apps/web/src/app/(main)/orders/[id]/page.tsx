"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import {
 Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Separator,
 Avatar, AvatarFallback, AvatarImage,
 Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Textarea,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Package, Truck, MapPin, CreditCard, Calendar, RotateCcw, FileDown, Check } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

const STATUS_CONFIG: Record<string, { color: "default" | "secondary" | "destructive" | "outline"; icon: typeof Package }> = {
 pending: { color: "secondary", icon: Package },
 confirmed: { color: "outline", icon: Package },
 shipped: { color: "default", icon: Truck },
 delivered: { color: "default", icon: Package },
 cancelled: { color: "destructive", icon: Package },
 refunded: { color: "destructive", icon: RotateCcw },
};

/**
 * Plan §3.6 MK4 — fixed four-step pipeline shown in the timeline.
 * We cache it as a constant so the UI keeps a stable skeleton even before
 * the tracking endpoint responds.
 */
const TRACKING_FALLBACK: Array<{ status: string; label: string; completed: boolean }> = [
 { status: "pending", label: "Order Placed", completed: true },
 { status: "confirmed", label: "Confirmed", completed: false },
 { status: "shipped", label: "Shipped", completed: false },
 { status: "delivered", label: "Delivered", completed: false },
];

export default function OrderDetailPage({ params }: Props) {
 const { id } = use(params);
 const [order, setOrder] = useState<Order | null>(null);
 const [loading, setLoading] = useState(true);
 const [refundOpen, setRefundOpen] = useState(false);
 const [refundReason, setRefundReason] = useState("");
 const [refunding, setRefunding] = useState(false);
 const [downloading, setDownloading] = useState(false);
 const [tracking, setTracking] = useState<
 Array<{ status: string; label: string; completed: boolean }>
 >(TRACKING_FALLBACK);

 useEffect(() => {
 commerceApi.getOrder(Number(id))
 .then(setOrder)
 .catch(() => toast.error("Failed to load order"))
 .finally(() => setLoading(false));
 // Tracking timeline is best-effort: we keep the skeleton if the
 // endpoint fails rather than blocking the whole order view.
 commerceApi.getOrderTracking(Number(id))
 .then((t) => {
 if (Array.isArray(t?.tracking_events)) setTracking(t.tracking_events);
 })
 .catch(() => undefined);
 }, [id]);

 const handleRefund = async () => {
 if (!refundReason.trim()) {
 toast.error("Please provide a reason");
 return;
 }
 setRefunding(true);
 try {
 await commerceApi.requestOrderRefund(Number(id), refundReason);
 setOrder((o) => o ? { ...o, status: "refunded" as const } : o);
 setRefundOpen(false);
 toast.success("Refund requested");
 } catch { toast.error("Failed to request refund"); }
 finally { setRefunding(false); }
 };

 const handleDownloadInvoice = async () => {
 if (!order) return;
 setDownloading(true);
 try {
 const { blob, filename } = await commerceApi.downloadOrderInvoice(order.id);
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = filename ?? `invoice-${order.id}.pdf`;
 document.body.appendChild(a);
 a.click();
 a.remove();
 // Give the browser a beat to start the download before revoking.
 setTimeout(() => URL.revokeObjectURL(url), 1000);
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to download invoice");
 } finally {
 setDownloading(false);
 }
 };

 if (loading) {
 return (
 <div className="mx-auto max-w-2xl space-y-4 px-3 py-4 sm:px-4">
 <Skeleton className="h-8 w-1/3" />
 <Skeleton className="h-48 w-full" />
 </div>
 );
 }

 if (!order) {
 return (
 <div className="mx-auto mt-8 max-w-2xl py-12 text-center">
 <p className="font-medium text-muted-foreground">Order not found.</p>
 </div>
 );
 }

 const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
 const canRefund = ["confirmed", "delivered"].includes(order.status);

 return (
 <div className="mx-auto max-w-2xl space-y-6 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between">
 <h1 className="text-2xl font-bold sm:text-[28px]">Order #{order.id}</h1>
 <Badge variant={statusCfg.color} className="gap-1 capitalize">
 <statusCfg.icon className="h-3 w-3" /> {order.status}
 </Badge>
 </div>

 {/* Product */}
 {order.product && (
 <Card>
 <CardContent className="p-4">
 <div className="flex gap-4">
 {order.product.images?.[0] && (
 <div className="relative h-20 w-20 shrink-0 overflow-hidden border bg-muted">
 <Image src={order.product.images[0].url} alt={order.product.title} fill unoptimized className="object-cover" />
 </div>
 )}
 <div className="min-w-0 flex-1">
 <Link href={`/marketplace/${order.product.id}`} className="text-sm font-semibold hover:underline">
 {order.product.title}
 </Link>
 <p className="mt-0.5 text-[13px] font-medium text-muted-foreground">Qty: {order.quantity}</p>
 <p className="mt-1 inline-block px-2 py-0.5 font-semibold text-primary">{order.currency} {order.total}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Plan §3.6 MK4 — tracking timeline */}
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
 <Truck className="h-4 w-4" /> Tracking
 </CardTitle>
 </CardHeader>
 <CardContent>
 <ol className="relative space-y-4 border-l pl-4">
 {tracking.map((ev) => (
 <li key={ev.status} className="relative">
 <span
 className={
 "absolute -left-[21px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border " +
 (ev.completed
 ? "bg-primary text-primary-foreground"
 : "bg-background")
 }
 aria-hidden
 >
 {ev.completed && <Check className="h-2.5 w-2.5" />}
 </span>
 <p
 className={
 "text-sm " + (ev.completed ? "font-semibold" : "text-muted-foreground")
 }
 >
 {ev.label}
 </p>
 {ev.status === order.status && (
 <p className="text-[13px] font-medium text-muted-foreground">
 Updated {new Date(order.updated_at ?? order.created_at).toLocaleString()}
 </p>
 )}
 </li>
 ))}
 </ol>
 </CardContent>
 </Card>

 {/* Order details */}
 <Card>
 <CardHeader><CardTitle className="text-sm font-semibold">Order Details</CardTitle></CardHeader>
 <CardContent className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="flex items-center gap-1.5 font-medium text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> Placed</span>
 <span>{new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
 </div>
 <div className="flex justify-between">
 <span className="flex items-center gap-1.5 font-medium text-muted-foreground"><CreditCard className="h-3.5 w-3.5" /> Payment</span>
 <span className="capitalize">{order.payment_method ?? "—"}</span>
 </div>
 {order.tracking_number && (
 <div className="flex justify-between">
 <span className="flex items-center gap-1.5 font-medium text-muted-foreground"><Truck className="h-3.5 w-3.5" /> Tracking</span>
 <span className="font-mono text-xs">{order.tracking_number}</span>
 </div>
 )}
 <Separator />
 <div className="flex justify-between font-semibold">
 <span>Total</span>
 <span>{order.currency} {order.total}</span>
 </div>
 </CardContent>
 </Card>

 {/* Shipping address */}
 {order.shipping_address && (
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-1.5 text-sm font-semibold"><MapPin className="h-4 w-4" /> Shipping Address</CardTitle></CardHeader>
 <CardContent className="text-sm space-y-0.5">
 <p className="font-medium">{order.shipping_address.name}</p>
 <p className="text-muted-foreground">{order.shipping_address.line1}</p>
 {order.shipping_address.line2 && <p className="text-muted-foreground">{order.shipping_address.line2}</p>}
 <p className="text-muted-foreground">
 {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
 </p>
 <p className="text-muted-foreground">{order.shipping_address.country}</p>
 {order.shipping_address.phone && <p className="text-muted-foreground">Tel: {order.shipping_address.phone}</p>}
 </CardContent>
 </Card>
 )}

 {/* Seller & buyer */}
 <div className="grid grid-cols-2 gap-4">
 {order.seller && (
 <Link href={`/profile/${order.seller.username}`} className="flex items-center gap-2 p-2 hover:bg-secondary/60">
 <Avatar className="h-8 w-8">
 <AvatarImage src={resolveAvatarUrl(order.seller.avatar)} />
 <AvatarFallback>{order.seller.first_name?.[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="text-[13px] font-medium text-muted-foreground">Seller</p>
 <p className="truncate text-sm font-semibold">{order.seller.first_name} {order.seller.last_name}</p>
 </div>
 </Link>
 )}
 {order.buyer && (
 <Link href={`/profile/${order.buyer.username}`} className="flex items-center gap-2 p-2 hover:bg-secondary/60">
 <Avatar className="h-8 w-8">
 <AvatarImage src={resolveAvatarUrl(order.buyer.avatar)} />
 <AvatarFallback>{order.buyer.first_name?.[0]}</AvatarFallback>
 </Avatar>
 <div className="min-w-0">
 <p className="text-[13px] font-medium text-muted-foreground">Buyer</p>
 <p className="truncate text-sm font-semibold">{order.buyer.first_name} {order.buyer.last_name}</p>
 </div>
 </Link>
 )}
 </div>

 {/* Actions */}
 <div className="grid gap-2">
 <Button
 variant="outline"
 className="gap-1.5 w-full"
 onClick={handleDownloadInvoice}
 disabled={downloading}
 >
 <FileDown className="h-4 w-4" />
 {downloading ? "Preparing…" : "Download invoice (PDF)"}
 </Button>
 {canRefund && (
 <Button variant="outline" className="gap-1.5 w-full" onClick={() => setRefundOpen(true)}>
 <RotateCcw className="h-4 w-4" /> Request Refund
 </Button>
 )}
 </div>

 <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
 <DialogContent>
 <DialogHeader><DialogTitle>Request Refund</DialogTitle></DialogHeader>
 <div className="space-y-3 py-2">
 <Textarea
 value={refundReason}
 onChange={(e) => setRefundReason(e.target.value)}
 placeholder="Reason for refund…"
 rows={3}
 />
 </div>
 <DialogFooter>
 <Button variant="outline" onClick={() => setRefundOpen(false)}>Cancel</Button>
 <Button onClick={handleRefund} disabled={refunding || !refundReason.trim()}>
 {refunding ? "Submitting…" : "Submit Request"}
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}
