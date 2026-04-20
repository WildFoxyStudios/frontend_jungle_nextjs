import Link from "next/link";
import { Button } from "@jungle/ui";
import { Tag, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/date";

interface OfferPostEmbedProps {
  offerInfo: { id: number; title: string; discount: string; description: string; expires_at: string };
}

export function OfferPostEmbed({ offerInfo }: OfferPostEmbedProps) {
  const isExpired = new Date(offerInfo.expires_at).getTime() < Date.now();

  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1">{offerInfo.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{offerInfo.description}</p>
          </div>
          <div className="bg-primary/10 text-primary px-3 py-1 flex flex-col items-center justify-center rounded-md text-sm font-bold min-w-[70px]">
            {offerInfo.discount}
            <span className="text-[10px] uppercase font-semibold">Off</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-muted p-2 rounded-lg">
          <Clock className="h-4 w-4" />
          {isExpired ? "Offer Expired" : `Ends ${formatDistanceToNow(offerInfo.expires_at)}`}
        </div>

        <Button asChild className="w-full" disabled={isExpired}>
          <Link href={`/offers/`}>Get Offer</Link>
        </Button>
      </div>
    </div>
  );
}
