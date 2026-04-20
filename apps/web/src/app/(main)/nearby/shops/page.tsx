"use client";

import { useEffect, useState } from "react";
import { commerceApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Card, CardContent, Skeleton, Badge } from "@jungle/ui";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function NearbyShopsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await commerceApi.getNearbyShops(coords.latitude, coords.longitude);
          setProducts(res as Product[]);
        } catch {
          setError("Failed to load nearby shops.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Location access denied. Please enable location to see nearby shops.");
        setLoading(false);
      }
    );
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Nearby Shops</h1>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      )}

      {error && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">{error}</CardContent></Card>
      )}

      {!loading && !error && products.length === 0 && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No shops found near your location.</CardContent></Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map((product) => (
          <Link key={product.id} href={`/marketplace/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
              <div className="relative aspect-square bg-muted">
                {product.images?.[0] && (
                  <img src={product.images[0].url} alt={product.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                )}
              </div>
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{product.title}</p>
                <p className="text-sm font-bold text-primary">{product.currency} {product.price}</p>
                {product.location && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />{product.location}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
