"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Button, Card, CardContent, Skeleton } from "@jungle/ui";
import { useTranslations } from "next-intl";

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("marketplace");

  useEffect(() => {
    productsApi.getProducts().then((r) => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild><Link href="/marketplace/create">{t("addProduct")}</Link></Button>
      </div>
      {loading ? <Skeleton className="h-48 w-full" /> : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {p.images[0] && <Image src={p.images[0].url} alt={p.title} fill className="object-cover" />}
              </div>
              <CardContent className="p-3">
                <Link href={`/marketplace/${p.id}`} className="font-semibold text-sm hover:underline line-clamp-2">{p.title}</Link>
                <p className="text-primary font-bold text-sm mt-1">{p.currency} {p.price}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
