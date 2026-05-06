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
 <div className="group overflow-hidden border rounded-lg bg-card transition-colors hover:bg-secondary/60">
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
 <div className="absolute bottom-3 right-3 flex items-center gap-1 border-2 border-white/70 bg-black/70 px-1.5 py-0.5 text-[13px] font-medium text-white">
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
