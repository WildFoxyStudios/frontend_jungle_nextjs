"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { commerceApi } from "@jungle/api-client";
import type { Offer } from "@jungle/api-client";
import {
  Card, CardContent, Skeleton, Badge, Avatar, AvatarFallback, AvatarImage, Button, Separator,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { Percent, Clock, Share2, Tag } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function OfferDetailPage({ params }: Props) {
  const { id } = use(params);
  const [offer, setOffer] = useState<Offer | null>(null);

  useEffect(() => {
    commerceApi.getOffer(Number(id))
      .then(setOffer)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load offer"));
  }, [id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch { /* silent */ }
  };

  if (!offer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    );
  }

  const isExpired = offer.expires_at && new Date(offer.expires_at) < new Date();

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">
      {/* Image */}
      {offer.image && (
        <div className="relative h-64 bg-muted rounded-lg overflow-hidden">
          <img src={offer.image} alt={offer.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <Badge className="absolute top-3 left-3 gap-1 text-sm" variant="destructive">
            <Percent className="h-3.5 w-3.5" /> {offer.discount_percent}% OFF
          </Badge>
          {isExpired && (
            <Badge className="absolute top-3 right-3" variant="secondary">Expired</Badge>
          )}
        </div>
      )}

      {/* Title & description */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{offer.title}</h1>
        {offer.description && <p className="text-sm text-muted-foreground">{offer.description}</p>}
      </div>

      {/* Pricing */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">{offer.currency} {offer.offer_price}</span>
            <span className="text-lg text-muted-foreground line-through">{offer.currency} {offer.original_price}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" /> Save {offer.currency} {(offer.original_price - offer.offer_price).toFixed(2)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expiry */}
      {offer.expires_at && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {isExpired
            ? <span className="text-destructive font-medium">This offer has expired</span>
            : <span>Expires {new Date(offer.expires_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</span>
          }
        </div>
      )}

      <Separator />

      {/* Seller */}
      {offer.seller && (
        <Link href={`/profile/${offer.seller.username}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 -m-2">
          <Avatar className="h-10 w-10">
            <AvatarImage src={resolveAvatarUrl(offer.seller.avatar)} />
            <AvatarFallback>{offer.seller.first_name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{offer.seller.first_name} {offer.seller.last_name}</p>
            <p className="text-xs text-muted-foreground">Offered by</p>
          </div>
        </Link>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-1.5" onClick={handleShare}>
          <Share2 className="h-4 w-4" /> Share Offer
        </Button>
      </div>
    </div>
  );
}
