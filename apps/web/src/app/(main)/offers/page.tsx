"use client";

import { useEffect, useState } from "react";
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
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" /> Offers
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-52 w-full rounded-lg" />)}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState icon={Tag} title="No offers available" description="Check back later for deals and discounts." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => {
            const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();
            return (
              <Card key={offer.id} className={`overflow-hidden ${isExpired ? "opacity-60" : ""}`}>
                {offer.image && (
                  <div className="relative h-40 bg-muted">
                    <img src={offer.image} alt={offer.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <Badge className="absolute top-2 left-2 gap-1" variant="destructive">
                      <Percent className="h-3 w-3" /> {offer.discount_percent}% OFF
                    </Badge>
                    {isExpired && (
                      <Badge className="absolute top-2 right-2" variant="secondary">Expired</Badge>
                    )}
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-base">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{offer.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-primary">{offer.currency} {offer.offer_price}</span>
                    <span className="text-sm text-muted-foreground line-through">{offer.currency} {offer.original_price}</span>
                  </div>
                  {offer.expires_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isExpired ? "Expired" : `Expires ${new Date(offer.expires_at).toLocaleDateString()}`}
                    </p>
                  )}
                  {offer.seller && (
                    <Link href={`/profile/${offer.seller.username}`} className="flex items-center gap-2 mt-1 hover:bg-muted/50 rounded p-1 -m-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={resolveAvatarUrl(offer.seller.avatar)} />
                        <AvatarFallback className="text-xs">{offer.seller.first_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{offer.seller.first_name} {offer.seller.last_name}</span>
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
