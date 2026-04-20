"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { 
  Button, Card, CardContent, Skeleton, Input, Badge,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Popover, PopoverContent, PopoverTrigger, Label, Separator
} from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Search, ShoppingBag, Filter, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function MarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  
  // New States for Parity
  const [distance, setDistance] = useState(0);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [priceSort, setPriceSort] = useState<'latest' | 'price_low' | 'price_high'>('latest');

  const t = useTranslations("marketplace");

  useEffect(() => {
    productsApi.getCategories()
      .then(setCategories)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load categories"));
  }, []);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const filters: any = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (searchQuery) filters.q = searchQuery;
    if (priceSort) filters.price_sort = priceSort;
    if (distance > 0 && lat && lng) {
      filters.lat = lat;
      filters.lng = lng;
      filters.distance = distance;
    }

    productsApi.getProducts(undefined, filters)
      .then((r) => setProducts(r.data))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [selectedCategory, searchQuery, distance, lat, lng, priceSort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        toast.success("Location updated successfully");
      },
      () => toast.error(t("locationAccessDenied"))
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-4 text-wow-body">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Button asChild className="btn-mat btn-mat-raised"><Link href="/marketplace/create">{t("addProduct")}</Link></Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products…"
            className="pl-9"
          />
        </div>

        {/* Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              {t("filters")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">{t("sortBy")}</h4>
              <Select value={priceSort} onValueChange={(v: any) => setPriceSort(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">{t("latest")}</SelectItem>
                  <SelectItem value="price_low">{t("priceLow")}</SelectItem>
                  <SelectItem value="price_high">{t("priceHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-medium">{t("distance")}</Label>
                <span className="text-sm font-bold text-primary">{distance} {t("km")}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="300" 
                value={distance} 
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              
              {!lat ? (
                <Button variant="secondary" size="sm" className="w-full gap-2" onClick={requestLocation}>
                  <MapPin className="h-3.5 w-3.5" />
                  {t("useLocation")}
                </Button>
              ) : (
                <p className="text-[10px] text-center text-muted-foreground">Location linked: {lat.toFixed(2)}, {lng?.toFixed(2)}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={!selectedCategory ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory("")}
          >
            All
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={selectedCategory === c.name ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(selectedCategory === c.name ? "" : c.name)}
            >
              {c.name}
            </Badge>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <Card key={p.id} className="overflow-hidden group hover:shadow-lg transition-shadow border-none shadow-sm wow_content">
              <Link href={`/marketplace/${p.id}`}>
                <div className="relative aspect-square bg-muted">
                  {p.images?.[0] ? (
                    <img src={p.images[0].url} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                  )}
                  {!p.is_available && (
                    <Badge variant="destructive" className="absolute top-2 left-2 text-xs">Sold Out</Badge>
                  )}
                  <div className="absolute bottom-2 right-2">
                     <Badge className="bg-white/90 text-black border-none font-bold backdrop-blur-sm">{p.currency} {p.price}</Badge>
                  </div>
                </div>
              </Link>
              <CardContent className="p-3">
                <Link href={`/marketplace/${p.id}`} className="font-semibold text-sm hover:underline line-clamp-2 min-h-[2.5rem]">{p.title}</Link>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {p.category && <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider truncate">{p.category}</span>}
                  </div>
                  {p.rating !== undefined && p.rating > 0 && (
                    <span className="text-[10px] font-bold inline-flex items-center gap-0.5">★ {p.rating.toFixed(1)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
