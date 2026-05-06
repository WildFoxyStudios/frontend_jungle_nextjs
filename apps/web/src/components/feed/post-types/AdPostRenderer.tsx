import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface AdPostRendererProps {
 adInfo: { id: number; headline: string; description: string; url: string; image: string; sponsor: string };
 onClickAction?: () => void;
}

export function AdPostRenderer({ adInfo, onClickAction }: AdPostRendererProps) {
 return (
 <a
 href={adInfo.url}
 target="_blank"
 rel="noopener noreferrer"
 onClick={onClickAction}
 className="group relative block overflow-hidden border rounded-lg bg-card transition-colors hover:bg-secondary/60"
 >
 <div className="absolute right-3 top-3 z-10 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold text-muted-foreground backdrop-blur">
 Sponsored
 </div>

 {adInfo.image && (
 <div className="relative aspect-[16/9] overflow-hidden bg-muted">
 <Image src={adInfo.image} alt="" fill unoptimized className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
 </div>
 )}
 
 <div className="space-y-3 border-t bg-secondary/40 p-4">
 <div className="space-y-1">
 <div className="text-[11px] font-semibold text-muted-foreground">
 {adInfo.sponsor}
 </div>
 <h3 className="line-clamp-1 text-base font-semibold transition-colors group-hover:text-primary">
 {adInfo.headline}
 </h3>
 <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{adInfo.description}</p>
 </div>
 
 <div className="flex items-center justify-between border rounded-lg bg-card px-3 py-2">
 <span className="truncate text-xs font-medium text-muted-foreground">
 External destination
 </span>
 <span className="flex items-center gap-1 text-xs font-semibold text-primary">
 Learn More <ExternalLink className="w-3 h-3" />
 </span>
 </div>
 </div>
 </a>
 );
}
