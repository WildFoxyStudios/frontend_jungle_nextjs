"use client";

import { useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import type { Order } from "@jungle/api-client";
import { 
 Card, CardContent, 
 Button, Badge, Skeleton
} from "@jungle/ui";
import { ShoppingBag, Package, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { format } from "date-fns";

export default function PurchasedOrdersPage() {
 const [orders, setOrders] = useState<Order[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 commerceApi.getOrders()
 .then((res) => setOrders(res.data))
 .catch(() => toast.error("Failed to load purchased orders"))
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="mx-auto max-w-4xl space-y-8 px-3 py-4 sm:px-4">
 <div className="animate-in fade-in slide-in-from-top-4 duration-500">
 <h1 className="flex items-center gap-3 text-2xl font-bold sm:text-[28px]">
 <ShoppingBag className="h-8 w-8 text-primary" /> My Purchases
 </h1>
 <p className="mt-1 font-medium text-muted-foreground">
 Track and manage all the products you&apos;ve bought from the marketplace.
 </p>
 </div>

 {loading ? (
 <div className="space-y-4">
 {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
 </div>
 ) : orders.length === 0 ? (
 <div className="py-12 text-center animate-in zoom-in-95 duration-500">
 <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
 <h3 className="text-lg font-semibold">No purchases yet</h3>
 <p className="mt-1 text-[15px] font-semibold text-muted-foreground">Explore the marketplace to find amazing products.</p>
 <Button asChild className="mt-4">
 <Link href="/marketplace">Browse Marketplace</Link>
 </Button>
 </div>
 ) : (
 <div className="grid gap-4">
 {orders.map((order, idx) => (
 <Link key={order.id} href={`/orders/${order.id}`} className="block">
 <Card className="group cursor-pointer transition-all duration-300 hover:bg-muted/50 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
 <CardContent className="flex items-center justify-between p-4">
 <div className="flex items-center gap-4">
 <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center border bg-primary/10 transition-colors group-hover:bg-primary/20">
 <ShoppingBag className="h-8 w-8 text-primary" />
 </div>
 <div className="space-y-1">
 <p className="font-semibold transition-colors group-hover:text-primary">Order #{order.id}</p>
 <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
 <Calendar className="h-3 w-3" /> {format(new Date(order.created_at), "MMM d, yyyy")}
 <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">{order.status}</Badge>
 </div>
 </div>
 </div>
 <div className="flex items-center gap-4 text-right">
 <div className="hidden sm:block">
 <p className="px-2 py-0.5 text-lg font-semibold text-primary">${order.total}</p>
 <p className="mt-1 text-[13px] font-medium text-muted-foreground">Via {order.payment_method || "Wallet"}</p>
 </div>
 <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
 </div>
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 )}
 </div>
 );
}
