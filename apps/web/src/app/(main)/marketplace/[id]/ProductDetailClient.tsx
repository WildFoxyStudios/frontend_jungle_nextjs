"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { productsApi } from "@jungle/api-client";
import type { Product, ProductReview } from "@jungle/api-client";
import { useCart } from "@jungle/hooks";
import {
  Button, Avatar, AvatarFallback, AvatarImage, Skeleton, Badge, Card, CardContent,
  Separator, Textarea, Label, Input,
} from "@jungle/ui";
import { MapPin, Star, ShoppingCart, ChevronLeft, ChevronRight, Share2, Check, MessageCircle } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";

interface Props { productId: number }

export function ProductDetailClient({ productId }: Props) {
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

  useEffect(() => {
    productsApi.getProduct(productId)
      .then(setProduct)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load product"));
    productsApi.getProductReviews(productId)
      .then((r) => setReviews(Array.isArray(r?.data) ? r.data : []))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load reviews"));
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    productsApi.getProducts(undefined, { category: product.category })
      .then((r) => setRelated((r?.data ?? []).filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => { /* related products are non-critical; avoid noisy toast */ });
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
    } catch { /* silent */ }
  };

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [{ id: 0, url: "", type: "image" as const }];

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
            {images[selectedImg]?.url ? (
              <img src={images[selectedImg].url} alt={product.title} className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No image</div>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImg((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setSelectedImg((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            {!product.is_available && (
              <Badge className="absolute top-2 left-2" variant="secondary">Sold out</Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImg(i)}
                  className={`relative w-16 h-16 rounded border-2 overflow-hidden shrink-0 ${i === selectedImg ? "border-primary" : "border-transparent"}`}
                >
                  {img.url && <img src={img.url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            {product.category && (
              <Badge variant="secondary" className="mt-1">{product.category}</Badge>
            )}
          </div>

          <p className="text-3xl font-bold text-primary">{product.currency} {product.price}</p>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating.toFixed(1)} ({product.review_count} reviews)
            </span>
          </div>

          {product.location && (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {product.location}
            </p>
          )}

          {/* Seller */}
          <Link href={`/profile/${product.seller.username}`} className="flex items-center gap-2 hover:bg-muted/50 rounded p-1.5 -m-1.5">
            <Avatar className="h-9 w-9">
              <AvatarImage src={resolveAvatarUrl(product.seller.avatar)} />
              <AvatarFallback>{product.seller.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{product.seller.first_name} {product.seller.last_name}</p>
              <p className="text-xs text-muted-foreground">Seller</p>
            </div>
          </Link>

          <Separator />

          {product.description && <p className="text-sm whitespace-pre-wrap">{product.description}</p>}

          {/* Quantity & Add to cart */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border rounded">
              <button className="px-3 py-1.5 hover:bg-muted" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="px-3 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{qty}</span>
              <button className="px-3 py-1.5 hover:bg-muted" onClick={() => setQty(qty + 1)}>+</button>
            </div>
            <Button
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!product.is_available || addedToCart || addItem.isPending}
            >
              {addedToCart ? <><Check className="h-4 w-4" /> Added</> : <><ShoppingCart className="h-4 w-4" /> Add to cart</>}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link href={`/messages?user=${product.seller.username}`}>
                <MessageCircle className="h-3.5 w-3.5" /> Message Seller
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
              <Share2 className="h-3.5 w-3.5" /> Share
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          Reviews <Badge variant="secondary">{reviews.length}</Badge>
        </h2>

        {/* Write a review */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label className="text-sm font-medium">Write a review</Label>
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
          <p className="text-sm text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
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

      {/* Related products */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.map((p) => (
              <Card key={p.id} className="overflow-hidden group">
                <div className="relative aspect-square bg-muted">
                  {p.images[0] && <img src={p.images[0].url} alt={p.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                </div>
                <CardContent className="p-2">
                  <Link href={`/marketplace/${p.id}`} className="text-sm font-medium hover:underline line-clamp-1">{p.title}</Link>
                  <p className="text-sm font-bold text-primary">{p.currency} {p.price}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
