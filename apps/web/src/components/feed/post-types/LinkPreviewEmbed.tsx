import Image from "next/image";
import { ExternalLink } from "lucide-react";

interface LinkPreviewEmbedProps {
 url: string;
 title?: string;
 description?: string;
 image?: string;
}

export function LinkPreviewEmbed({ url, title, description, image }: LinkPreviewEmbedProps) {
 const hostname = (() => {
 try {
 return new URL(url).hostname.replace(/^www\./, "");
 } catch {
 return url;
 }
 })();

 return (
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="group block overflow-hidden border rounded-lg bg-card transition-colors hover:bg-secondary/60"
 >
 {image && (
 <div className="relative aspect-[1.91/1] bg-muted overflow-hidden">
 <Image
 src={image}
 alt=""
 fill
 unoptimized
 className="object-cover transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 )}
 <div className="p-3 space-y-1">
 {title && <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>}
 {description && <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>}
 <div className="pt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
 <ExternalLink className="h-3 w-3" />
 {hostname}
 </div>
 </div>
 </a>
 );
}
