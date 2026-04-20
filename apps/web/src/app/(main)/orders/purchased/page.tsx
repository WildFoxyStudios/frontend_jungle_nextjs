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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" /> My Purchases
        </h1>
        <p className="text-muted-foreground mt-1 italic">
          Track and manage all the products you've bought from the marketplace.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed animate-in zoom-in-95 duration-500">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold">No purchases yet</h3>
            <p className="text-muted-foreground text-sm">Explore the marketplace to find amazing products.</p>
            <Button asChild className="mt-4 rounded-xl font-bold shadow-lg shadow-primary/20">
                <Link href="/marketplace">Browse Marketplace</Link>
            </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map((order, idx) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="block">
              <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer border-muted animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10 transition-colors group-hover:bg-primary/10">
                        <ShoppingBag className="h-8 w-8 text-primary opacity-50" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold group-hover:text-primary transition-colors">Order #{order.id}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> {format(new Date(order.created_at), "MMM d, yyyy")}
                        <Badge variant="secondary" className="px-1.5 py-0 text-[10px] uppercase font-bold tracking-widest bg-muted/50 text-muted-foreground">{order.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-4">
                    <div className="hidden sm:block">
                        <p className="text-lg font-black text-primary">${order.total}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight opacity-60">Via {order.payment_method || "Wallet"}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
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
