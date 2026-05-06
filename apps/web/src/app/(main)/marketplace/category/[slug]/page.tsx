"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import { Button, Skeleton, Badge } from "@jungle/ui";
import { ShoppingBag, MapPin, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CategoryBrowsePage() {
	const params = useParams();
	const slug = decodeURIComponent((params.slug as string) || "");
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);

	const fetchProducts = useCallback(() => {
		setLoading(true);
		productsApi.getProducts(undefined, { category: slug })
			.then((r) => setProducts(r.data))
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load products"))
			.finally(() => setLoading(false));
	}, [slug]);

	useEffect(() => { fetchProducts(); }, [fetchProducts]);

	return (
		<div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
			<Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
				<ArrowLeft className="h-4 w-4" /> Back to Marketplace
			</Link>

			<h1 className="text-2xl font-bold sm:text-[28px] mb-6 capitalize">{slug}</h1>

			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square w-full rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
						</div>
					))}
				</div>
			) : products.length === 0 ? (
				<div className="py-16 text-center">
					<ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
					<h2 className="text-lg font-semibold">No products in {slug}</h2>
					<p className="text-sm text-muted-foreground mt-1 mb-4">Check back later or browse other categories</p>
					<Button asChild><Link href="/marketplace">Browse all</Link></Button>
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
