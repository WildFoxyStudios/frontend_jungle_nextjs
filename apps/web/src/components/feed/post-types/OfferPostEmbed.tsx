import Link from "next/link";
import { Button } from "@jungle/ui";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date";

interface OfferPostEmbedProps {
 offerInfo: { id: number; title: string; discount: string; description: string; expires_at: string };
}

export function OfferPostEmbed({ offerInfo }: OfferPostEmbedProps) {
 const isExpired = new Date(offerInfo.expires_at).getTime() < Date.now();

 return (
 <div className="overflow-hidden border rounded-lg bg-card">
 <div className="space-y-4 p-4">
 <div className="flex items-start justify-between gap-3">
 <div className="space-y-1">
 <h3 className="line-clamp-1 text-lg font-semibold">{offerInfo.title}</h3>
 <p className="line-clamp-2 text-sm text-muted-foreground">{offerInfo.description}</p>
 </div>
 <div className="flex min-w-[76px] flex-col items-center justify-center border rounded-md bg-primary px-3 py-2 text-sm font-extrabold text-primary-foreground">
 {offerInfo.discount}
 <span className="text-[10px] font-extrabold text-primary-foreground/90">Off</span>
 </div>
 </div>

 <div className="flex items-center gap-2 rounded-md bg-muted/40 p-3 text-[13px] font-medium text-muted-foreground">
 <Clock className="h-4 w-4" />
 {isExpired ? "Offer Expired" : `Ends ${formatDistanceToNow(offerInfo.expires_at)}`}
 </div>

 <Button asChild className="w-full font-semibold" variant={isExpired ? "secondary" : "default"}>
 <Link href={`/offers/${offerInfo.id}`}>{isExpired ? "View Offer" : "Get Offer"}</Link>
 </Button>
 </div>
 </div>
 );
}
