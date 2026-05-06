import Image from "next/image";
import { ExternalLink, Globe } from "lucide-react";
import { GenericOEmbedRenderer } from "./GenericOEmbedRenderer";

interface RichUrlPreviewEmbedProps {
 url: string;
 title?: string;
 description?: string;
 image?: string;
 siteName?: string;
}

const OEMBED_DOMAINS = [
 "youtube.com", "youtu.be",
 "vimeo.com",
 "spotify.com",
 "soundcloud.com",
 "twitch.tv",
 "tiktok.com",
];

function isOEmbedUrl(url: string): boolean {
 try {
 const hostname = new URL(url).hostname.replace(/^www\./, "");
 return OEMBED_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d));
 } catch {
 return false;
 }
}

function getHostname(url: string): string {
 try {
 return new URL(url).hostname.replace(/^www\./, "");
 } catch {
 return url;
 }
}

export function RichUrlPreviewEmbed({ url, title, description, image, siteName }: RichUrlPreviewEmbedProps) {
 if (isOEmbedUrl(url)) {
 return <GenericOEmbedRenderer url={url} title={title} thumbnail={image} />;
 }

 const hostname = getHostname(url);
 const displayName = siteName ?? hostname;

 return (
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="group block overflow-hidden border rounded-lg bg-card transition-colors hover:bg-secondary/60"
 >
 <div className={image ? "md:flex" : ""}>
 {image && (
 <div className="relative aspect-[1.91/1] overflow-hidden bg-muted md:aspect-auto md:w-[220px] md:shrink-0">
 <Image
 src={image}
 alt={title ?? ""}
 fill
 unoptimized
 className="object-cover transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 )}
 <div className="space-y-2 p-3.5 md:flex-1 md:p-4">
 <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
 <Globe className="h-3 w-3" />
 <span className="truncate">{displayName}</span>
 </div>
 {title && (
 <h3 className="text-sm font-semibold leading-5 transition-colors group-hover:text-primary">
 {title}
 </h3>
 )}
 {description && (
 <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
 {description}
 </p>
 )}
 <div className="flex items-center gap-1 text-xs text-primary">
 <ExternalLink className="h-3 w-3" />
 <span className="truncate">{hostname}</span>
 </div>
 </div>
 </div>
 </a>
 );
}
