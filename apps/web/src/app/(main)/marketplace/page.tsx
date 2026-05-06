"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product } from "@jungle/api-client";
import {
	Button, Card, Skeleton, Input, Badge,
	Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@jungle/ui";
import { useRealtimeEvent } from "@jungle/hooks";
import { useTranslations } from "next-intl";
import { Search, ShoppingBag, MapPin, Heart, Clock } from "lucide-react";
import { toast } from "sonner";

const SORT_OPTIONS = [
	{ id: "latest", label: "sortNewest" },
	{ id: "price_low", label: "priceLow" },
	{ id: "price_high", label: "priceHigh" },
] as const;

export default function MarketplacePage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [featured, setFeatured] = useState<Product[]>([]);
	const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [searchQuery, setSearchQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [priceSort, setPriceSort] = useState<"latest" | "price_low" | "price_high">("latest");
	const [distance, setDistance] = useState(0);
	const [lat, setLat] = useState<number | null>(null);
	const [lng, setLng] = useState<number | null>(null);
	const [savedProducts, setSavedProducts] = useState<Set<number>>(new Set());

	const t = useTranslations("marketplace");

	useEffect(() => {
		productsApi.getCategories().then(setCategories).catch(() => {});
	}, []);

	const fetchProducts = useCallback(() => {
		setLoading(true);
		const filters: Record<string, unknown> = {};
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

	// Today's Picks
	useEffect(() => {
		productsApi.getProducts(undefined, { price_sort: "latest" })
			.then((r) => setFeatured(r.data.slice(0, 6)))
			.catch(() => {});
	}, []);

	useEffect(() => { fetchProducts(); }, [fetchProducts]);

	// Re-fetch on real-time notifications (new orders, reviews, etc.)
	useRealtimeEvent("notification.new", () => {
		fetchProducts();
	});

	const requestLocation = () => {
		if (!navigator.geolocation) return toast.error("Geolocation not supported");
		navigator.geolocation.getCurrentPosition(
			(pos) => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
			() => toast.error(t("locationAccessDenied")),
		);
	};

	const toggleSave = (productId: number) => {
		setSavedProducts((prev) => {
			const next = new Set(prev);
			if (next.has(productId)) next.delete(productId);
			else next.add(productId);
			return next;
		});
	};

	const timeAgo = (dateStr: string) => {
		const diff = Date.now() - new Date(dateStr).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return "Just now";
		if (mins < 60) return `${mins}m`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d`;
		const weeks = Math.floor(days / 7);
		return `${weeks}w`;
	};

	return (
		<div className="mx-auto max-w-6xl space-y-6 px-3 py-4 sm:px-4">
			{/* Header */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h1 className="text-2xl font-bold sm:text-[28px]">{t("title")}</h1>
				<div className="flex flex-wrap gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href="/marketplace/saved">
							<Heart className="h-4 w-4 mr-1.5" /> {t("savedItems")}
						</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link href="/marketplace/my-shop">{t("myProducts")}</Link>
					</Button>
					<Button asChild size="sm">
						<Link href="/marketplace/create">{t("addProduct")}</Link>
					</Button>
				</div>
			</div>

			{/* Today's Picks */}
			{featured.length > 0 && (
				<section>
					<h2 className="text-lg font-bold mb-3">{t("todayPicks")}</h2>
					<div className="relative">
						<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory">
							{featured.map((p) => (
								<Link
									key={p.id}
									href={`/marketplace/${p.id}`}
									className="shrink-0 w-40 snap-start group"
								>
									<div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
										{p.images?.[0]?.url ? (
											<Image
												src={p.images[0].url}
												alt={p.title}
												fill
												unoptimized
												className="object-cover transition-transform group-hover:scale-105"
											/>
										) : (
											<div className="absolute inset-0 flex items-center justify-center">
												<ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
											</div>
										)}
										<div className="absolute bottom-2 left-2">
											<Badge className="text-xs font-bold">
												{p.currency} {p.price}
											</Badge>
										</div>
									</div>
									<p className="mt-1.5 text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
										{p.title}
									</p>
									<p className="text-[12px] text-muted-foreground">{p.location || "—"}</p>
								</Link>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Category pills */}
			{categories.length > 0 && (
				<div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
					<button
						type="button"
						onClick={() => setSelectedCategory("")}
						className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
							!selectedCategory
								? "bg-primary text-primary-foreground"
								: "bg-muted hover:bg-muted/80"
						}`}
					>
						{t("all") ?? "All"}
					</button>
					{categories.slice(0, 15).map((c) => (
						<button
							key={c.id}
							type="button"
							onClick={() => setSelectedCategory(selectedCategory === c.name ? "" : c.name)}
							className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
								selectedCategory === c.name
									? "bg-primary text-primary-foreground"
									: "bg-muted hover:bg-muted/80"
							}`}
						>
							{c.name}
						</button>
					))}
				</div>
			)}

			{/* Search + Sort */}
			<div className="flex flex-wrap gap-3">
				<div className="relative flex-1 min-w-[200px]">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search Marketplace"
						className="pl-9"
					/>
				</div>
				<Select value={priceSort} onValueChange={(v) => setPriceSort(v as typeof priceSort)}>
					<SelectTrigger className="w-40">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{SORT_OPTIONS.map((s) => (
							<SelectItem key={s.id} value={s.id}>{t(s.label)}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					size="icon"
					onClick={requestLocation}
					title={t("useLocation")}
				>
					<MapPin className={`h-4 w-4 ${lat ? "text-primary" : ""}`} />
				</Button>
			</div>

			{/* Distance slider */}
			{lat && lng && (
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-muted-foreground">{t("distance")}:</span>
					<input
						type="range"
						min="0"
						max="200"
						value={distance}
						onChange={(e) => setDistance(Number(e.target.value))}
						className="h-1.5 flex-1 cursor-pointer accent-primary"
					/>
					<span className="text-sm font-semibold text-primary min-w-[4ch]">
						{distance > 0 ? `${distance} ${t("km")}` : t("all") ?? "All"}
					</span>
				</div>
			)}

			{/* Product Grid */}
			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square w-full rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-4 w-1/2" />
						</div>
					))}
				</div>
			) : products.length === 0 ? (
				<div className="py-16 text-center">
					<ShoppingBag className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
					<h2 className="text-lg font-semibold">No products found</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{searchQuery ? "Try a different search term" : "Nothing listed yet in this category"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
					{products.map((p) => (
						<Card key={p.id} className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
							<Link href={`/marketplace/${p.id}`} className="relative block aspect-square bg-muted">
								{p.images?.[0]?.url ? (
									<Image
										src={p.images[0].url}
										alt={p.title}
										fill
										unoptimized
										className="object-cover transition-transform group-hover:scale-105"
									/>
								) : (
									<div className="absolute inset-0 flex items-center justify-center">
										<ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
									</div>
								)}
								<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
									<span className="text-lg font-bold text-white">
										{p.currency && p.price != null ? `${p.currency} ${p.price}` : (p.price ?? "Free")}
									</span>
								</div>
								{!p.is_available && (
									<Badge variant="destructive" className="absolute left-2 top-2 text-xs">Sold</Badge>
								)}
								<button
									type="button"
									onClick={(e) => { e.preventDefault(); toggleSave(p.id); }}
									className={`absolute right-2 top-2 rounded-full p-1.5 transition-colors ${
										savedProducts.has(p.id)
											? "bg-primary text-primary-foreground"
											: "bg-white/80 text-muted-foreground hover:bg-white"
									}`}
								>
									<Heart className={`h-4 w-4 ${savedProducts.has(p.id) ? "fill-current" : ""}`} />
								</button>
							</Link>
							<div className="p-3 space-y-1">
								<Link
									href={`/marketplace/${p.id}`}
									className="text-[14px] font-semibold line-clamp-2 hover:text-primary transition-colors"
								>
									{p.title}
								</Link>
								<div className="flex items-center justify-between text-[12px] text-muted-foreground">
									<span className="inline-flex items-center gap-1 truncate">
										<MapPin className="h-3 w-3 shrink-0" /> {p.location || "—"}
									</span>
									<span className="inline-flex items-center gap-1 shrink-0">
										<Clock className="h-3 w-3" /> {timeAgo(p.created_at)}
									</span>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
