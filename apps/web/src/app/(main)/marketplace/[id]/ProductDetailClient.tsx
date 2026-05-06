"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product, ProductReview, PublicUser } from "@jungle/api-client";
import { useCart } from "@jungle/hooks";
import {
	Button, Avatar, AvatarFallback, AvatarImage, Skeleton, Badge, Card, CardContent,
	Separator, Textarea, Label,
} from "@jungle/ui";
import {
	MapPin, Star, ShoppingCart, ChevronLeft, ChevronRight, Share2, Check,
	MessageCircle, Heart, ShieldCheck, Clock, ArrowLeft,
} from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { googleMapsLatLng, googleMapsSearchQuery } from "@/lib/map-links";
import { MapView } from "@/components/shared/MapView";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props { productId: number }

function normalizeProductSeller(
	rawSeller: Partial<PublicUser> | null | undefined,
	userIdFallback: number,
): PublicUser {
	const id =
		typeof rawSeller?.id === "number" && rawSeller.id > 0 ? rawSeller.id : userIdFallback;
	const uname =
		typeof rawSeller?.username === "string" && rawSeller.username.trim().length > 0
			? rawSeller.username
			: "unknown";
	return {
		id,
		uuid: typeof rawSeller?.uuid === "string" ? rawSeller.uuid : "",
		username: uname,
		first_name:
			typeof rawSeller?.first_name === "string" && rawSeller.first_name.trim().length > 0
				? rawSeller.first_name
				: "Unknown",
		last_name: typeof rawSeller?.last_name === "string" ? rawSeller.last_name : "Seller",
		avatar: typeof rawSeller?.avatar === "string" ? rawSeller.avatar : "",
		is_verified: Boolean(rawSeller?.is_verified),
		is_online: Boolean(rawSeller?.is_online),
		is_pro: typeof rawSeller?.is_pro === "number" ? rawSeller.is_pro : 0,
	};
}

function normalizeProduct(raw: Product): Product {
	const images = Array.isArray(raw.images)
		? raw.images
		: (Array.isArray((raw as unknown as { media?: Product["images"] }).media)
			? (raw as unknown as { media: Product["images"] }).media
			: []);

	const userIdFallback = Number((raw as unknown as { user_id?: number }).user_id ?? 0);

	const lat =
		typeof raw.latitude === "number" && Number.isFinite(raw.latitude)
			? raw.latitude
			: undefined;
	const lng =
		typeof raw.longitude === "number" && Number.isFinite(raw.longitude)
			? raw.longitude
			: undefined;

	return {
		...raw,
		title: raw.title ?? (raw as unknown as { name?: string }).name ?? "Untitled product",
		images,
		seller: normalizeProductSeller(raw.seller, userIdFallback),
		rating: Number(raw.rating ?? 0),
		review_count: Number(raw.review_count ?? 0),
		is_available: Boolean(raw.is_available ?? true),
		description: raw.description ?? "",
		category: raw.category ?? "",
		location: raw.location ?? "",
		latitude: lat,
		longitude: lng,
	};
}

const CONDITION_LABELS: Record<string, string> = {
	new: "New",
	"like_new": "Like New",
	good: "Good",
	fair: "Fair",
};

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return `${Math.floor(days / 7)}w ago`;
}

export function ProductDetailClient({ productId }: Props) {
	const t = useTranslations("marketplace");
	const [product, setProduct] = useState<Product | null>(null);
	const [selectedImg, setSelectedImg] = useState(0);
	const [reviews, setReviews] = useState<ProductReview[]>([]);
	const [related, setRelated] = useState<Product[]>([]);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewComment, setReviewComment] = useState("");
	const [submittingReview, setSubmittingReview] = useState(false);
	const [qty, setQty] = useState(1);
	const { addItem } = useCart();
	const [addedToCart, setAddedToCart] = useState(false);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		productsApi.getProduct(productId)
			.then((raw) => setProduct(normalizeProduct(raw)))
			.catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load product"));

		productsApi.getProductReviews(productId)
			.then((r) => setReviews(Array.isArray(r?.data) ? r.data : []))
			.catch(() => {});
	}, [productId]);

	useEffect(() => {
		if (!product) return;
		productsApi.getProducts(undefined, { category: product.category })
			.then((r) =>
				setRelated(
					(r?.data ?? [])
						.map(normalizeProduct)
						.filter((p) => p.id !== product.id)
						.slice(0, 4),
				),
			)
			.catch(() => {});
	}, [product]);

	const handleAddToCart = () => {
		addItem.mutate({ productId, qty }, {
			onSuccess: () => { setAddedToCart(true); toast.success("Added to cart"); },
			onError: () => toast.error("Failed to add to cart"),
		});
	};

	const handleSubmitReview = async () => {
		if (!reviewComment.trim()) return;
		setSubmittingReview(true);
		try {
			const review = await productsApi.createReview(productId, { rating: reviewRating, comment: reviewComment });
			setReviews((prev) => [review, ...prev]);
			setReviewComment("");
			setReviewRating(5);
			toast.success("Review submitted");
		} catch { toast.error("Failed to submit review"); }
		finally { setSubmittingReview(false); }
	};

	const handleShare = async () => {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied");
		} catch {}
	};

	if (!product) {
		return (
			<div className="mx-auto max-w-6xl px-3 py-6 sm:px-4 space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<Skeleton className="aspect-square w-full rounded-lg" />
					<div className="space-y-4">
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-6 w-1/3" />
						<Skeleton className="h-32 w-full" />
					</div>
				</div>
			</div>
		);
	}

	const productImages = Array.isArray(product.images) ? product.images : [];
	const images = productImages.length > 0 ? productImages : [{ id: 0, url: "", type: "image" as const }];
	const hasMapCoords = product.latitude != null && product.longitude != null && Number.isFinite(product.latitude) && Number.isFinite(product.longitude);

	return (
		<div className="mx-auto max-w-6xl px-3 py-6 sm:px-4">
			<Link
				href="/marketplace"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
			>
				<ArrowLeft className="h-4 w-4" /> Back to Marketplace
			</Link>

			<div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-6">
				{/* Left: Image gallery */}
				<div className="space-y-3">
					<div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
						{images[selectedImg]?.url ? (
							<Image
								src={images[selectedImg].url}
								alt={product.title}
								fill
								priority
								unoptimized
								className="object-cover"
							/>
						) : (
							<div className="flex items-center justify-center h-full text-muted-foreground">
								<ShoppingCart className="h-16 w-16" />
							</div>
						)}
						{images.length > 1 && (
							<>
								<button
									onClick={() => setSelectedImg((i) => (i - 1 + images.length) % images.length)}
									className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
								>
									<ChevronLeft className="h-5 w-5" />
								</button>
								<button
									onClick={() => setSelectedImg((i) => (i + 1) % images.length)}
									className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white transition-colors"
								>
									<ChevronRight className="h-5 w-5" />
								</button>
							</>
						)}
						{!product.is_available && (
							<Badge className="absolute left-3 top-3 text-sm px-3 py-1" variant="destructive">Sold</Badge>
						)}
						<button
							type="button"
							onClick={() => setSaved(!saved)}
							className={`absolute right-3 top-3 rounded-full p-2 shadow-md transition-colors ${
								saved ? "bg-primary text-primary-foreground" : "bg-white/90 hover:bg-white"
							}`}
						>
							<Heart className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />
						</button>
					</div>

					{images.length > 1 && (
						<div className="flex gap-2 overflow-x-auto pb-1">
							{images.map((img, i) => (
								<button
									key={img.id}
									onClick={() => setSelectedImg(i)}
									className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
										i === selectedImg ? "border-primary" : "border-transparent hover:border-muted-foreground"
									}`}
								>
									{img.url && <Image src={img.url} alt="" fill unoptimized className="object-cover" />}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Right: Product info */}
				<div className="space-y-5">
					<div>
						<h1 className="text-2xl font-bold leading-tight">{product.title}</h1>
						<div className="flex flex-wrap items-center gap-2 mt-2">
							{product.category && (
								<Badge variant="secondary" className="text-xs">{product.category}</Badge>
							)}
							{(product as unknown as { condition?: string }).condition && (
								<Badge variant="outline" className="text-xs font-medium">
									{CONDITION_LABELS[(product as unknown as { condition: string }).condition] ?? (product as unknown as { condition: string }).condition}
								</Badge>
							)}
						</div>
					</div>

					<p className="text-3xl font-bold text-primary">
						{product.currency} {product.price}
					</p>

					{/* Rating */}
					<div className="flex items-center gap-2">
						<div className="flex">
							{[1, 2, 3, 4, 5].map((s) => (
								<Star
									key={s}
									className={`h-4 w-4 ${s <= Math.round(product.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
								/>
							))}
						</div>
						<span className="text-sm text-muted-foreground">
							{product.rating.toFixed(1)} ({product.review_count} reviews)
						</span>
					</div>

					{/* Seller card */}
					<div className="rounded-xl border bg-card p-4 space-y-3">
						<Link
							href={`/profile/${product.seller.username}`}
							className="flex items-center gap-3 hover:opacity-80 transition-opacity"
						>
							<Avatar className="h-12 w-12">
								<AvatarImage src={resolveAvatarUrl(product.seller.avatar)} />
								<AvatarFallback>{product.seller.first_name?.[0]}</AvatarFallback>
							</Avatar>
							<div>
								<p className="text-sm font-semibold flex items-center gap-1">
									{product.seller.first_name} {product.seller.last_name}
									{product.seller.is_verified && (
										<ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
									)}
								</p>
								<p className="text-xs text-muted-foreground">{t("sellerInfo")}</p>
							</div>
						</Link>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
								<Link href={`/messages?userId=${product.seller.id}`}>
									<MessageCircle className="h-4 w-4" /> {t("messageSeller")}
								</Link>
							</Button>
						</div>
					</div>

					{/* Location & map */}
					{(product.location || hasMapCoords) && (
						<div className="space-y-2">
							{product.location && (
								<p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
									<MapPin className="h-4 w-4" /> {product.location}
								</p>
							)}
							{hasMapCoords && (
								<>
									<MapView
										className="h-[200px] w-full rounded-lg"
										center={[product.latitude!, product.longitude!]}
										zoom={14}
										markers={[{ id: "product", lat: product.latitude!, lng: product.longitude!, label: product.title }]}
									/>
									<Button variant="outline" size="sm" className="gap-2 w-full" asChild>
										<a href={googleMapsLatLng(product.latitude!, product.longitude!)} target="_blank" rel="noopener noreferrer">
											<ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
										</a>
									</Button>
								</>
							)}
							{!hasMapCoords && !!product.location?.trim() && (
								<Button variant="outline" size="sm" className="gap-2 w-full" asChild>
									<a href={googleMapsSearchQuery(product.location)} target="_blank" rel="noopener noreferrer">
										<ExternalLink className="h-3.5 w-3.5" /> Open in Google Maps
									</a>
								</Button>
							)}
						</div>
					)}

					{/* Add to cart */}
					<div className="flex items-center gap-3">
						<div className="flex items-center rounded-lg border">
							<button type="button" className="px-3 py-2 hover:bg-muted transition-colors" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
							<span className="min-w-[2.5rem] px-3 py-2 text-center text-sm font-semibold border-x">{qty}</span>
							<button type="button" className="px-3 py-2 hover:bg-muted transition-colors" onClick={() => setQty(qty + 1)}>+</button>
						</div>
						<Button
							className="flex-1 gap-2"
							size="lg"
							onClick={handleAddToCart}
							disabled={!product.is_available || addedToCart || addItem.isPending}
						>
							{addedToCart ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingCart className="h-4 w-4" /> Add to cart</>}
						</Button>
					</div>

					<div className="flex gap-2">
						<Button variant="ghost" size="sm" className="gap-2" onClick={handleShare}>
							<Share2 className="h-4 w-4" /> Share
						</Button>
					</div>

					{product.description && (
						<>
							<Separator />
							<div>
								<h3 className="text-sm font-semibold uppercase text-muted-foreground mb-2">Description</h3>
								<p className="text-sm whitespace-pre-wrap leading-relaxed">{product.description}</p>
							</div>
						</>
					)}

					<p className="text-[12px] text-muted-foreground flex items-center gap-1">
						<Clock className="h-3 w-3" /> Listed {timeAgo(product.created_at)}
					</p>
				</div>
			</div>

			{/* Reviews */}
			<div className="mt-10 space-y-4">
				<h2 className="text-lg font-bold flex items-center gap-2">
					Reviews <Badge variant="secondary">{reviews.length}</Badge>
				</h2>

				<Card>
					<CardContent className="p-4 space-y-3">
						<Label className="text-sm font-semibold">Write a review</Label>
						<div className="flex gap-1">
							{[1, 2, 3, 4, 5].map((s) => (
								<button key={s} onClick={() => setReviewRating(s)} className="p-0.5">
									<Star className={`h-5 w-5 ${s <= reviewRating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
								</button>
							))}
						</div>
						<Textarea
							value={reviewComment}
							onChange={(e) => setReviewComment(e.target.value)}
							placeholder="Share your experience…"
							rows={3}
						/>
						<Button size="sm" onClick={handleSubmitReview} disabled={submittingReview || !reviewComment.trim()}>
							{submittingReview ? "Submitting…" : "Submit Review"}
						</Button>
					</CardContent>
				</Card>

				{reviews.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-8">No reviews yet. Be the first!</p>
				) : (
					<div className="space-y-3">
						{reviews.map((r) => (
							<Card key={r.id}>
								<CardContent className="p-4">
									<div className="flex items-center gap-3">
										<Avatar className="h-8 w-8">
											<AvatarImage src={resolveAvatarUrl(r.user.avatar)} />
											<AvatarFallback className="text-xs">{r.user.first_name?.[0]}</AvatarFallback>
										</Avatar>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium truncate">{r.user.first_name} {r.user.last_name}</p>
											<div className="flex items-center gap-1">
												{[1, 2, 3, 4, 5].map((s) => (
													<Star key={s} className={`h-3 w-3 ${s <= r.rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
												))}
											</div>
										</div>
										<span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
									</div>
									<p className="text-sm mt-2">{r.comment}</p>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Related */}
			{related.length > 0 && (
				<div className="mt-10 space-y-4">
					<h2 className="text-lg font-bold">{t("similarItems")}</h2>
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{related.map((p) => (
							<Card key={p.id} className="group overflow-hidden border-0 shadow-sm">
								<Link href={`/marketplace/${p.id}`} className="relative block aspect-square bg-muted">
									{p.images[0]?.url && (
										<Image src={p.images[0].url} alt={p.title} fill unoptimized className="object-cover transition-transform group-hover:scale-105" />
									)}
								</Link>
								<CardContent className="p-3">
									<Link href={`/marketplace/${p.id}`} className="text-sm font-semibold line-clamp-1 hover:text-primary">
										{p.title}
									</Link>
									<p className="text-sm font-bold text-primary mt-0.5">{p.currency} {p.price}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
