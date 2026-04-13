"use client";

import { useCart } from "@jungle/hooks";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, Button, Separator } from "@jungle/ui";
import { X } from "lucide-react";

export function CartDrawer({ children }: { children: React.ReactNode }) {
  const { cart, removeItem } = useCart();
  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader><SheetTitle>Cart ({items.length})</SheetTitle></SheetHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Your cart is empty.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.title}</p>
                    <p className="text-xs text-muted-foreground">{item.product.currency} {item.product.price} × {item.quantity}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem.mutate(item.id)}><X className="h-3.5 w-3.5" /></Button>
                </div>
              ))
            )}
          </div>
          {items.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button className="w-full">Checkout</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
