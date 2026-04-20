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
      className="block border rounded-xl overflow-hidden bg-background hover:bg-muted/30 transition-colors group"
    >
      {image && (
        <div className="relative aspect-[1.91/1] bg-muted overflow-hidden">
          <img
            src={image}
            alt={title ?? ""}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
        </div>
      )}
      <div className="p-3 space-y-1">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          <Globe className="h-3 w-3" />
          {displayName}
        </div>
        {title && (
          <h3 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-primary">
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{hostname}</span>
        </div>
      </div>
    </a>
  );
}
