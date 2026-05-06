"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { commerceApi, usersApi, paymentsApi } from "@jungle/api-client";
import { resolveMediaUrl } from "@/lib/media";
import type { Cart, Address } from "@jungle/api-client";
import {
 Card, CardContent, CardHeader, CardTitle, CardFooter,
 Button, Label, Badge, Skeleton, Separator,
 RadioGroup, RadioGroupItem,
} from "@jungle/ui";
import {
 ShoppingCart, Trash2, MapPin, CreditCard,
 Wallet, ShoppingBag, Plus
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
 /** Shipping address chosen in the list (was always `addresses[0]` before). */
 const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
 const [paymentMethod, setPaymentMethod] = useState("wallet");
 const [wallet, setWallet] = useState<{ balance: number; currency: string } | null>(null);

 useEffect(() => {
 const loadData = async () => {
 try {
 const [cartRes, addrRes] = await Promise.all([
 commerceApi.getCart(),
 usersApi.getAddresses()
 ]);
 setCart(cartRes);
 const addrList = addrRes || [];
 setAddresses(addrList);
 if (addrList.length > 0) {
 const pick =
 addrList.find((a) => a.is_default)?.id ?? addrList[0].id;
 setSelectedAddressId(pick);
 } else {
 setSelectedAddressId(null);
 }
 } catch {
 toast.error(t("cartFailed"));
 } finally {
 setLoading(false);
 }
 };
 void loadData();
 }, [t]);

 useEffect(() => {
 void paymentsApi
 .getWallet()
 .then((w) => setWallet({ balance: w.balance, currency: w.currency }))
 .catch(() => setWallet(null));
 }, []);

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
 if (!cart?.items.length || selectedAddressId == null) return;
 const addr = addresses.find((a) => a.id === selectedAddressId);
 if (!addr) {
 toast.error(t("cartFailed"));
 return;
 }

 const addressSnapshot: Record<string, unknown> = {
 address_id: addr.id,
 label: addr.name,
 line1: addr.line1,
 line2: addr.line2 ?? "",
 city: addr.city,
 state: addr.state,
 country: addr.country,
 postal_code: addr.postal_code,
 phone: addr.phone,
 };

 setOrdering(true);
 try {
 const createdIds: number[] =
 paymentMethod === "wallet"
 ? (
 await commerceApi.checkoutWithWallet({
 lines: cart.items.map((item) => ({
 product_id: item.product.id,
 quantity: item.quantity,
 })),
 address: addressSnapshot,
 })
 ).ids
 : [];
 if (paymentMethod !== "wallet") {
 for (const item of cart.items) {
 const orderRes = await commerceApi.createOrder(item.product.id, {
 quantity: item.quantity,
 address: addressSnapshot,
 });
 createdIds.push(orderRes.id);
 }
 }
 await commerceApi.clearCart();
 setCart(await commerceApi.getCart());
 toast.success(
 createdIds.length === 1 ? t("success") : t("successMultiple", { count: createdIds.length }),
 );
 const firstId = createdIds[0];
 if (paymentMethod === "stripe") {
 if (createdIds.length > 1) {
 toast.info(t("stripePayManyHint", { count: createdIds.length }));
 }
 router.push(`/checkout/${firstId}`);
 } else {
 router.push(`/orders/${firstId}`);
 }
 } catch (err) {
 toast.error(err instanceof Error ? err.message : t("failed"));
 } finally {
 setOrdering(false);
 }
 };

 if (loading) return <CheckoutSkeleton />;

 if (!cart || cart.items.length === 0) {
 return (
 <div className="mx-auto max-w-2xl space-y-6 py-24 text-center">
 <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border bg-muted">
 <ShoppingCart className="h-10 w-10 text-muted-foreground" />
 </div>
 <h1 className="text-2xl font-bold sm:text-[28px]">{t("emptyCart")}</h1>
 <p className="font-medium text-muted-foreground">{t("emptyCartDesc")}</p>
 <Button asChild className="h-12 px-8">
 <Link href="/marketplace">{t("goShopping")}</Link>
 </Button>
 </div>
 );
 }

 const subtotal = cart.total;
 const walletMatchesCartCurrency =
 wallet != null &&
 cart.currency.toUpperCase() === wallet.currency.toUpperCase();
 const walletBelowTotal =
 wallet != null && walletMatchesCartCurrency && wallet.balance < subtotal;

 return (
 <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4">
 <h1 className="mb-8 flex items-center gap-3 text-2xl font-bold sm:text-[28px]">
 <ShoppingBag className="h-8 w-8 text-primary" /> {t("title")}
 </h1>

 <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-6">
 {/* Cart Items */}
 <Card className="overflow-hidden">
 <CardHeader className="bg-secondary/40 pb-4">
 <CardTitle className="text-lg font-semibold">{t("shoppingCart", { count: cart.items.length })}</CardTitle>
 </CardHeader>
 <CardContent className="divide-y-2 divide-foreground p-0">
 {cart.items.map((item) => (
 <div key={item.id} className="flex gap-4 p-6 animate-in fade-in slide-in-from-bottom-2">
 <div className="h-24 w-24 flex-shrink-0 overflow-hidden border bg-muted">
 <Image
 src={resolveMediaUrl(item.product?.images?.[0]?.url)}
 alt={item.product?.title}
 width={96}
 height={96}
 unoptimized
 className="h-full w-full object-cover"
 />
 </div>
 <div className="flex flex-1 flex-col justify-between">
 <div>
 <h3 className="font-semibold transition-colors hover:text-primary">{item.product?.title}</h3>
 <p className="line-clamp-1 text-sm text-muted-foreground">{item.product?.description}</p>
 </div>
 <div className="flex items-center justify-between">
 <div className="flex h-8 items-center overflow-hidden">
 <button type="button" onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="px-2 hover:bg-secondary/60">-</button>
 <span className="w-10 px-3 text-center text-[13px] font-medium">{item.quantity}</span>
 <button type="button" onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="px-2 hover:bg-secondary/60">+</button>
 </div>
 <div className="flex items-center gap-4">
 <span className="px-2 py-0.5 text-sm font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
 <Button variant="ghost" size="sm" onClick={() => handleRemove(item.id)} className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10">
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
 <Card className="overflow-hidden">
 <CardHeader className="bg-secondary/40 pb-4">
 <CardTitle className="flex items-center gap-2 text-lg font-semibold">
 <MapPin className="h-5 w-5" /> {t("shippingAddress")}
 </CardTitle>
 </CardHeader>
 <CardContent className="p-6">
 {addresses.length === 0 ? (
 <div className="py-12 text-center">
 <p className="mb-2 text-[15px] font-semibold text-muted-foreground">
 {t("noAddressesSaved")}
 </p>
 <p className="mb-4 text-xs text-muted-foreground">{t("addAddressBeforeOrder")}</p>
 <Button variant="outline" className="gap-2" asChild>
 <Link href="/settings/addresses">
 <Plus className="h-4 w-4" /> {t("addNewAddress")}
 </Link>
 </Button>
 </div>
 ) : (
 <RadioGroup
 value={
 selectedAddressId != null
 ? String(selectedAddressId)
 : undefined
 }
 onValueChange={(v) => setSelectedAddressId(Number(v))}
 >
 {addresses.map((addr) => (
 <div key={addr.id} className="flex items-start gap-4 p-4 transition-colors hover:bg-secondary/40">
 <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
 <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
 <div className="mb-1 flex items-center gap-2">
 <span className="font-semibold">{addr.name}</span>
 {addr.is_default && <Badge variant="secondary" className="h-4 text-[10px]">{t("default")}</Badge>}
 </div>
 <p className="text-xs leading-relaxed text-muted-foreground">
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
 <Card className="sticky top-24 overflow-hidden">
 <CardHeader className="bg-primary/10 pb-4">
 <CardTitle className="font-semibold">{t("orderSummary")}</CardTitle>
 </CardHeader>
 <CardContent className="space-y-4 p-6">
 <div className="space-y-2">
 <div className="flex justify-between text-muted-foreground">
 <span>{t("subtotal")}</span>
 <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-muted-foreground">
 <span>{t("shippingEstimate")}</span>
 <span className="text-green-600 font-medium text-[10px]">{t("free")}</span>
 </div>
 </div>
 
 <Separator />
 
 <div className="flex items-center justify-between py-2">
 <span className="text-xl font-semibold">{t("total")}</span>
 <span className="px-2 py-0.5 text-3xl font-bold text-primary">${subtotal.toFixed(2)}</span>
 </div>

 <div className="space-y-3 pt-4">
 <Label className="px-1 text-[13px] font-medium text-muted-foreground">{t("paymentMethod")}</Label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setPaymentMethod("wallet")}
 className={`flex flex-col items-center gap-2 border p-4 transition-all ${paymentMethod === 'wallet' ? 'border-foreground bg-primary/10' : 'border-foreground bg-card hover:bg-muted/50'}`}
 >
 <Wallet className={`h-6 w-6 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-muted-foreground'}`} />
 <span className="text-[13px] font-medium">{t("walletBalance")}</span>
 {wallet != null && (
 <span className="text-[11px] font-bold tabular-nums text-primary">
 {t("walletBalanceAvailable", {
 currency: wallet.currency,
 balance: wallet.balance.toFixed(2),
 })}
 </span>
 )}
 </button>
 <button
 type="button"
 onClick={() => setPaymentMethod("stripe")}
 className={`flex flex-col items-center gap-2 border p-4 transition-all ${paymentMethod === 'stripe' ? 'border-foreground bg-primary/10' : 'border-foreground bg-card hover:bg-muted/50'}`}
 >
 <CreditCard className={`h-6 w-6 ${paymentMethod === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`} />
 <span className="text-[13px] font-medium">{t("creditCard")}</span>
 </button>
 </div>
 {walletBelowTotal && (
 <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-950 dark:text-amber-100">
 {t("walletInsufficient")}
 </p>
 )}
 {paymentMethod === "stripe" && (
 <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-medium text-foreground">
 {t("cardCheckoutNextStep")}
 </p>
 )}
 </div>
 </CardContent>
 <CardFooter className="p-6 pt-0">
 <Button
 onClick={handlePlaceOrder}
 disabled={ordering || selectedAddressId == null}
 title={
 selectedAddressId == null ? t("placeOrderBlockedNoAddress") : undefined
 }
 className="h-14 w-full text-lg font-semibold"
 >
 {ordering ? t("processing") : t("placeOrder")}
 </Button>
 </CardFooter>
 </Card>

 <div className="space-y-2 px-4 text-center">
 <p className="text-[13px] font-medium text-muted-foreground">{t("secureCheckout")}</p>
 <div className="flex justify-center gap-4 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default">
 <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-3 w-auto" alt="Visa" width={96} height={12} unoptimized />
 <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-3 w-auto" alt="Mastercard" width={96} height={12} unoptimized />
 <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png" className="h-3 w-auto" alt="Paypal" width={96} height={12} unoptimized />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

function CheckoutSkeleton() {
 return (
 <div className="mx-auto max-w-6xl space-y-8 px-3 py-4 sm:px-4">
 <Skeleton className="h-10 w-48" />
 <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-6">
 <Skeleton className="h-64 w-full" />
 <Skeleton className="h-48 w-full" />
 </div>
 <Skeleton className="h-[500px] w-full" />
 </div>
 </div>
 );
}
