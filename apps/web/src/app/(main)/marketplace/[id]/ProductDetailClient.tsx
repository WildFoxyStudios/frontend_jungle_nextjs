"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Button, Avatar, AvatarFallback, AvatarImage, Skeleton } from "@jungle/ui";
import { MapPin } from "lucide-react";

interface Props { productId: number }

export function ProductDetailClient({ productId }: Props) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    productsApi.getProduct(productId).then(setProduct).catch(() => {});
  }, [productId]);

  if (!product) return <Skeleton className="h-64 w-full max-w-3xl mx-auto mt-4" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          {product.images.map((img) => (
            <div key={img.id} className="relative aspect-square bg-muted rounded overflow-hidden">
              <Image src={img.url} alt={product.title} fill className="object-cover" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-3xl font-bold text-primary">{product.currency} {product.price}</p>
          <p className="text-sm text-muted-foreground inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {product.location}</p>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8"><AvatarImage src={product.seller.avatar} /><AvatarFallback>{product.seller.first_name[0]}</AvatarFallback></Avatar>
            <span className="text-sm">{product.seller.first_name} {product.seller.last_name}</span>
          </div>
          {product.description && <p className="text-sm">{product.description}</p>}
          <Button className="w-full">Add to cart</Button>
        </div>
      </div>
    </div>
  );
}
