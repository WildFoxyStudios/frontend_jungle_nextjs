import Link from "next/link";
import { Badge } from "@jungle/ui";
import { Radio, Eye } from "lucide-react";

interface LiveCommentEmbedProps {
  liveInfo: {
    id: number;
    title?: string;
    is_live: boolean;
    viewer_count: number;
    recording_url?: string;
    streamer?: { username: string; first_name?: string; last_name?: string; avatar?: string };
  };
}

export function LiveCommentEmbed({ liveInfo }: LiveCommentEmbedProps) {
  const href = `/live/${liveInfo.id}`;

  return (
    <Link href={href}>
      <div className="border rounded-xl overflow-hidden bg-background hover:bg-muted/30 transition-colors group">
        {/* Thumbnail area */}
        <div className="relative aspect-video bg-gradient-to-br from-red-900 to-red-600 flex items-center justify-center">
          <Radio className="h-12 w-12 text-white/60" />
          {liveInfo.is_live && (
            <div className="absolute top-3 left-3">
              <Badge variant="destructive" className="animate-pulse text-xs gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white inline-block" />
                LIVE
              </Badge>
            </div>
          )}
          {!liveInfo.is_live && liveInfo.recording_url && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="text-xs">Replay</Badge>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white text-xs bg-black/50 rounded px-1.5 py-0.5">
            <Eye className="h-3 w-3" />
            {liveInfo.viewer_count.toLocaleString()}
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          {liveInfo.title && (
            <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
              {liveInfo.title}
            </p>
          )}
          {liveInfo.streamer && (
            <p className="text-xs text-muted-foreground">
              {liveInfo.streamer.first_name} {liveInfo.streamer.last_name}
              {" · "}@{liveInfo.streamer.username}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
