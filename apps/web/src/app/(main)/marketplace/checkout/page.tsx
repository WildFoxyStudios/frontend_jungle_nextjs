"use client";

import { useEffect, useState } from "react";
import { commerceApi, usersApi } from "@jungle/api-client";
import { resolveMediaUrl } from "@/lib/media";
import type { Cart, Address } from "@jungle/api-client";
import {
  Card, CardContent, CardHeader, CardTitle, CardFooter,
  Button, Input, Label, Badge, Skeleton, Separator,
  RadioGroup, RadioGroupItem,
} from "@jungle/ui";
import {
  ShoppingCart, Trash2, MapPin, CreditCard,
  Wallet, ChevronRight, CheckCircle2, ShoppingBag, Plus
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function CheckoutPage() {
  const router = useRouter();
  const t = useTranslations("checkout");
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cartRes, addrRes] = await Promise.all([
          commerceApi.getCart(),
          usersApi.getAddresses()
        ]);
        setCart(cartRes);
        setAddresses(addrRes || []);
      } catch (err) {
        toast.error(t("cartFailed"));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [t]);

  const handleUpdateQty = async (id: number, qty: number) => {
    if (qty < 1) return;
    try {
      const res = await commerceApi.updateCartItem(id, qty);
      setCart(res);
    } catch {
      toast.error(t("qtyFailed"));
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const res = await commerceApi.removeFromCart(id);
      setCart(res);
      toast.success(t("itemRemoved"));
    } catch {
      toast.error(t("removeFailed"));
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart?.items.length) return;
    setOrdering(true);
    try {
      const orderRes = await commerceApi.createOrder(cart.items[0].product.id, {
        quantity: cart.items[0].quantity,
        address_id: addresses[0]?.id || 0
      });
      toast.success(t("success"));
      router.push(`/orders/${orderRes.id}`);
    } catch (err) {
      toast.error(t("failed"));
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <CheckoutSkeleton />;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-6">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <h1 className="text-3xl font-bold">{t("emptyCart")}</h1>
        <p className="text-muted-foreground">{t("emptyCartDesc")}</p>
        <Button asChild className="rounded-xl h-12 px-8">
          <Link href="/products">{t("goShopping")}</Link>
        </Button>
      </div>
    );
  }

  const subtotal = cart.total;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
        <ShoppingBag className="h-8 w-8 text-primary" /> {t("title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Cart Items */}
          <Card className="border-muted shadow-sm overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">{t("shoppingCart", { count: cart.items.length })}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="p-6 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-24 w-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 border">
                    <img
                      src={resolveMediaUrl(item.product?.images?.[0]?.url)}
                      alt={item.product?.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold hover:text-primary transition-colors">{item.product?.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.product?.description}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border rounded-lg overflow-hidden h-8">
                        <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="px-2 hover:bg-muted">-</button>
                        <span className="px-3 text-xs font-bold w-10 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="px-2 hover:bg-muted">+</button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm">${(item.product.price * item.quantity).toFixed(2)}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="border-muted shadow-sm overflow-hidden rounded-3xl">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" /> {t("shippingAddress")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {addresses.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-4">No addresses found.</p>
                  <Button variant="outline" className="rounded-xl gap-2">
                    <Plus className="h-4 w-4" /> {t("addNewAddress")}
                  </Button>
                </div>
              ) : (
                <RadioGroup defaultValue={addresses[0].id.toString()}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start gap-4 p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                      <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
                      <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{addr.name}</span>
                          {addr.is_default && <Badge variant="secondary" className="text-[10px] h-4">{t("default")}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {addr.line1}, {addr.city}, {addr.country}
                        </p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary side */}
        <div className="space-y-6">
          <Card className="border-muted shadow-lg rounded-[2rem] sticky top-24 overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle>{t("orderSummary")}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>{t("shippingEstimate")}</span>
                  <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">{t("free")}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center py-2">
                <span className="text-xl font-bold">{t("total")}</span>
                <span className="text-3xl font-black text-primary">${subtotal.toFixed(2)}</span>
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-60 px-1">{t("paymentMethod")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'wallet' ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/30'}`}
                  >
                    <Wallet className={`h-6 w-6 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{t("walletBalance")}</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod("stripe")}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5 shadow-md' : 'border-muted hover:border-primary/30'}`}
                  >
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{t("creditCard")}</span>
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button onClick={handlePlaceOrder} disabled={ordering} className="w-full h-14 text-lg font-black uppercase tracking-tighter rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                {ordering ? t("processing") : t("placeOrder")}
              </Button>
            </CardFooter>
          </Card>

          <div className="text-center px-4 space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t("secureCheckout")}</p>
            <div className="flex justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3" alt="Visa" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-3" alt="Mastercard" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" className="h-3" alt="Paypal" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    </div>
  );
}
