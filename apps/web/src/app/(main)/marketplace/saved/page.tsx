"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Button, Skeleton, Badge } from "@jungle/ui";
import { useTranslations } from "next-intl";
import { Heart, ShoppingBag, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function SavedProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const t = useTranslations("marketplace");

	const fetchSaved = useCallback(() => {
		setLoading(true);
		productsApi.getSavedProducts()
			.then((r) => setProducts(Array.isArray(r?.data) ? r.data : []))
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load saved items"))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { fetchSaved(); }, [fetchSaved]);

	return (
		<div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
			<Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to Marketplace
			</Link>

			<h1 className="text-2xl font-bold sm:text-[28px] mb-1">{t("savedItems")}</h1>
			<p className="text-[15px] font-semibold text-muted-foreground mb-6">
				Items you&apos;ve saved for later
			</p>

			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square w-full rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
					))}
				</div>
			) : products.length === 0 ? (
				<div className="py-16 text-center">
					<Heart className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
					<h2 className="text-lg font-semibold">{t("noSavedItems")}</h2>
					<p className="text-sm text-muted-foreground mt-1 mb-4">
						Save items you like by tapping the heart icon
					</p>
					<Button asChild>
						<Link href="/marketplace">Browse Marketplace</Link>
					</Button>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{products.map((p) => (
						<Link key={p.id} href={`/marketplace/${p.id}`} className="group">
							<div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
								{p.images?.[0]?.url ? (
									<Image src={p.images[0].url} alt={p.title} fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
								) : (
									<div className="absolute inset-0 flex items-center justify-center">
										<ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
									</div>
								)}
								<div className="absolute bottom-2 left-2">
									<Badge className="text-xs font-bold">{p.currency} {p.price}</Badge>
								</div>
							</div>
							<p className="mt-1.5 text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
								{p.title}
							</p>
							<p className="text-[12px] text-muted-foreground flex items-center gap-1">
								<MapPin className="h-3 w-3" /> {p.location || "—"}
							</p>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
