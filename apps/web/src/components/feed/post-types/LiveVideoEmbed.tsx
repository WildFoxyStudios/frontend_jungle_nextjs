import { Radio, Users } from "lucide-react";

interface LiveVideoEmbedProps {
 liveInfo: { is_live: boolean; viewer_count: number; recording_url?: string };
 videoUrl?: string; // fallback if it's already ended and recorded
}

export function LiveVideoEmbed({ liveInfo, videoUrl }: LiveVideoEmbedProps) {
 const replayUrl = liveInfo.recording_url || videoUrl;

 if (!liveInfo.is_live && replayUrl) {
 return (
 <div className="relative aspect-video overflow-hidden border bg-black" role="region" aria-label="Live stream replay">
 <video src={replayUrl} className="h-full w-full" controls preload="none" />
 <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
 Was Live
 </div>
 </div>
 );
 }

 return (
 <div className="group relative flex aspect-video items-center justify-center overflow-hidden border bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950" role="region" aria-label="Live stream in progress">
 <div className="absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_top,rgba(255,255,255,0.10),transparent_36%),linear-gradient(135deg,transparent,rgba(239,68,68,0.18))]" />

 <div className="absolute left-3 top-3 flex animate-pulse items-center gap-1.5 border-2 border-white/80 bg-red-600 px-2.5 py-1 text-xs font-extrabold text-white">
 <span className="block h-1.5 w-1.5 rounded-full bg-white" />
 LIVE
 </div>

 <div className="absolute left-[78px] top-3 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[13px] font-medium text-white backdrop-blur">
 <Users className="h-3 w-3" />
 {liveInfo.viewer_count} viewers
 </div>

 <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center text-white">
 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-105">
 <Radio className="h-7 w-7" />
 </div>
 <div className="space-y-1">
 <p className="text-base font-semibold">Live stream in progress</p>
 <p className="text-sm text-white/75">
 The full interactive live viewer is available on the dedicated live page.
 </p>
 </div>
 </div>

 <div className="absolute bottom-3 right-3 border-2 border-white/70 bg-black/70 px-3 py-1 text-[13px] font-medium text-white">
 Preview
 </div>
 </div>
 );
}
