import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";

interface GenericOEmbedRendererProps {
  url: string;
  title?: string;
  thumbnail?: string;
}

type Provider = {
  name: string;
  color: string;
  embedFn: (url: string) => string | null;
};

const PROVIDERS: Provider[] = [
  {
    name: "YouTube",
    color: "#FF0000",
    embedFn: (url) => {
      const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
      return m ? `https://www.youtube.com/embed/${m[1]}?autoplay=1` : null;
    },
  },
  {
    name: "Vimeo",
    color: "#1ab7ea",
    embedFn: (url) => {
      const m = url.match(/vimeo\.com\/(\d+)/);
      return m ? `https://player.vimeo.com/video/${m[1]}?autoplay=1` : null;
    },
  },
  {
    name: "Spotify",
    color: "#1DB954",
    embedFn: (url) => {
      const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
      return m ? `https://open.spotify.com/embed/${m[1]}/${m[2]}` : null;
    },
  },
  {
    name: "SoundCloud",
    color: "#FF7700",
    embedFn: (url) => {
      if (!url.includes("soundcloud.com")) return null;
      return `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true&visual=true`;
    },
  },
  {
    name: "Twitch",
    color: "#9146FF",
    embedFn: (url) => {
      const m = url.match(/twitch\.tv\/(?:videos\/(\d+)|([A-Za-z0-9_]+))/);
      if (!m) return null;
      const parent = typeof window !== "undefined" ? window.location.hostname : "localhost";
      if (m[1]) return `https://player.twitch.tv/?video=${m[1]}&parent=${parent}&autoplay=true`;
      return `https://player.twitch.tv/?channel=${m[2]}&parent=${parent}&autoplay=true`;
    },
  },
  {
    name: "TikTok",
    color: "#000000",
    embedFn: (url) => {
      const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
      return m ? `https://www.tiktok.com/embed/v2/${m[1]}` : null;
    },
  },
];

function detectProvider(url: string): { provider: Provider; embedUrl: string } | null {
  for (const p of PROVIDERS) {
    const embedUrl = p.embedFn(url);
    if (embedUrl) return { provider: p, embedUrl };
  }
  return null;
}

export function GenericOEmbedRenderer({ url, title, thumbnail }: GenericOEmbedRendererProps) {
  const [playing, setPlaying] = useState(false);
  const detected = detectProvider(url);

  if (!detected) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate">{title ?? url}</span>
      </a>
    );
  }

  const { provider, embedUrl } = detected;
  const isAudio = provider.name === "Spotify" || provider.name === "SoundCloud";
  const aspectClass = isAudio ? "h-36" : "aspect-video";

  if (playing) {
    return (
      <div className={`rounded-xl overflow-hidden w-full ${aspectClass}`}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
          allowFullScreen
          title={title ?? provider.name}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden cursor-pointer group ${aspectClass} bg-muted`}
      onClick={() => setPlaying(true)}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title ?? provider.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: provider.color + "33" }}
        />
      )}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

      {/* Provider badge */}
      <div
        className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-0.5 rounded"
        style={{ backgroundColor: provider.color }}
      >
        {provider.name}
      </div>

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <Play className="h-7 w-7 fill-black text-black ml-0.5" />
        </div>
      </div>

      {title && (
        <div className="absolute bottom-3 left-3 right-3 text-white text-sm font-medium line-clamp-1 drop-shadow">
          {title}
        </div>
      )}
    </div>
  );
}
