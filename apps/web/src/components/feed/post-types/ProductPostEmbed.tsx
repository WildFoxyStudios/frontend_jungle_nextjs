import Link from "next/link";
import { Button } from "@jungle/ui";
import { ShoppingCart, MapPin, Tag } from "lucide-react";

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
    <div className="border rounded-xl overflow-hidden bg-background">
      {productInfo.image && (
        <div className="relative aspect-video bg-muted">
          <img src={productInfo.image} alt={productInfo.name} className="absolute inset-0 w-full h-full object-cover" />
          {!productInfo.in_stock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full font-semibold text-sm">Out of Stock</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{productInfo.name}</h3>
            <div className="text-xl font-bold text-primary mt-1">
              {productInfo.currency}{productInfo.price.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="flex text-xs text-muted-foreground gap-3">
          <div className="flex items-center gap-1">
            <Tag className="w-3.5 h-3.5" />
            {productInfo.category}
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-[150px]">{productInfo.location}</span>
          </div>
        </div>

        <Button asChild className="w-full" disabled={!productInfo.in_stock}>
          <Link href={`/products/${productInfo.id}`}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            {productInfo.in_stock ? "Contact Seller" : "Sold Out"}
          </Link>
        </Button>
      </div>
    </div>
  );
}
