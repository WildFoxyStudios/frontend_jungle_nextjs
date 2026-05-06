"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import type { Offer } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge, Avatar, AvatarImage, AvatarFallback } from "@jungle/ui";
import { Tag, Clock, Percent } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";

export default function OffersPage() {
 const [offers, setOffers] = useState<Offer[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 commerceApi.getOffers()
 .then((r) => setOffers(Array.isArray(r?.data) ? r.data : []))
 .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load offers"))
 .finally(() => setLoading(false));
 }, []);

 return (
 <div className="mx-auto max-w-4xl space-y-4 px-3 py-4 sm:px-4">
 <div className="flex items-center justify-between">
 <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-[28px]">
 <Tag className="h-6 w-6" /> Offers
 </h1>
 </div>

 {loading ? (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-52 w-full" />)}
 </div>
 ) : offers.length === 0 ? (
 <EmptyState icon={Tag} title="No offers available" description="Check back later for deals and discounts." />
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 {offers.map((offer) => {
 const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
 return (
 <Card key={offer.id} className={`overflow-hidden transition-colors hover:bg-muted/50 ${isExpired ? "opacity-60" : ""}`}>
 {offer.image && (
 <div className="relative h-40 border-b bg-muted">
 <Image src={offer.image} alt={offer.title} fill unoptimized className="object-cover" />
 <Badge className="absolute left-2 top-2 gap-1" variant="destructive">
 <Percent className="h-3 w-3" /> {offer.discount_percent}% OFF
 </Badge>
 {isExpired && (
 <Badge className="absolute right-2 top-2" variant="secondary">Expired</Badge>
 )}
 </div>
 )}
 <CardContent className="space-y-2 p-4">
 <h3 className="text-base font-semibold">{offer.title}</h3>
 {offer.description && (
 <p className="line-clamp-2 text-sm text-muted-foreground">{offer.description}</p>
 )}
 <div className="flex items-center gap-3">
 <span className="px-2 py-0.5 text-lg font-semibold text-primary">{offer.currency} {offer.offer_price}</span>
 <span className="text-sm text-muted-foreground line-through">{offer.currency} {offer.original_price}</span>
 </div>
 {offer.expires_at && (
 <p className="flex items-center gap-1 text-[13px] font-medium text-muted-foreground">
 <Clock className="h-3 w-3" />
 {isExpired ? "Expired" : `Expires ${new Date(offer.expires_at).toLocaleDateString()}`}
 </p>
 )}
 {offer.seller && (
 <Link href={`/profile/${offer.seller.username}`} className="-m-1 mt-1 flex items-center gap-2 p-1 hover:bg-secondary/60">
 <Avatar className="h-6 w-6">
 <AvatarImage src={resolveAvatarUrl(offer.seller.avatar)} />
 <AvatarFallback className="text-xs">{offer.seller.first_name?.[0]}</AvatarFallback>
 </Avatar>
 <span className="text-[13px] font-medium text-muted-foreground">{offer.seller.first_name} {offer.seller.last_name}</span>
 </Link>
 )}
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 );
}
