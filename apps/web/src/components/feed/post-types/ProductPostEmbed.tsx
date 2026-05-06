import Image from "next/image";
import Link from "next/link";
import { Button } from "@jungle/ui";
import { ShoppingBag, MapPin, Tag } from "lucide-react";

interface ProductPostEmbedProps {
 productInfo: {
 id: number;
 name: string;
 price: number;
 currency: string;
 location: string;
 category: string;
 in_stock: boolean;
 image: string;
 };
}

export function ProductPostEmbed({ productInfo }: ProductPostEmbedProps) {
 return (
 <div className="overflow-hidden border rounded-lg bg-card">
 {productInfo.image && (
 <div className="relative aspect-[4/3] bg-muted">
 <Image src={productInfo.image} alt={productInfo.name} fill unoptimized className="object-cover" />
 <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
 <span className="border-2 border-white/70 bg-black/70 px-3 py-1 text-sm font-extrabold text-white backdrop-blur">
 {productInfo.currency}
 {productInfo.price.toFixed(2)}
 </span>
 <span className="border-2 border-white/70 bg-black/70 px-3 py-1 text-[13px] font-medium text-white">
 {productInfo.category}
 </span>
 </div>
 {!productInfo.in_stock && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/45">
 <span className="border rounded-md bg-destructive px-3 py-1 text-sm font-extrabold text-destructive-foreground">
 Sold
 </span>
 </div>
 )}
 </div>
 )}
 <div className="space-y-3 p-4">
 <div className="space-y-1">
 <h3 className="line-clamp-1 text-lg font-semibold">{productInfo.name}</h3>
 <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1 rounded-full bg-muted/45 px-2.5 py-1">
 <Tag className="h-3.5 w-3.5" />
 {productInfo.category}
 </span>
 {productInfo.location && (
 <span className="inline-flex items-center gap-1 rounded-full bg-muted/45 px-2.5 py-1">
 <MapPin className="h-3.5 w-3.5" />
 <span className="max-w-[180px] truncate">{productInfo.location}</span>
 </span>
 )}
 <span
 className={`inline-flex border px-2.5 py-1 text-[13px] font-medium ${productInfo.in_stock ? "bg-success/20 text-foreground" : "bg-destructive/15 text-destructive"}`}
 >
 {productInfo.in_stock ? "In stock" : "Currently unavailable"}
 </span>
 </div>
 </div>

 <div className="border rounded-md bg-secondary/40 p-3">
 <div className="text-[13px] font-medium text-muted-foreground">Marketplace</div>
 <div className="mt-1 text-xl font-bold text-primary">
 {productInfo.currency}{productInfo.price.toFixed(2)}
 </div>
 <p className="mt-1 text-sm text-muted-foreground">
 Open the product page to view details and available seller actions.
 </p>
 </div>

 <Button asChild className="w-full font-semibold" variant={productInfo.in_stock ? "default" : "secondary"}>
 <Link href={`/products/${productInfo.id}`}>
 <ShoppingBag className="mr-2 h-4 w-4" />
 {productInfo.in_stock ? "View Product" : "View Product"}
 </Link>
 </Button>
 </div>
 </div>
 );
}
