import { Play, Users } from "lucide-react";

interface LiveVideoEmbedProps {
  liveInfo: { is_live: boolean; viewer_count: number; recording_url?: string };
  videoUrl?: string; // fallback if it's already ended and recorded
}

export function LiveVideoEmbed({ liveInfo, videoUrl }: LiveVideoEmbedProps) {
  if (!liveInfo.is_live && videoUrl) {
    return (
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video src={videoUrl} className="w-full h-full" controls preload="none" />
        <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 flex items-center gap-1 rounded text-xs font-semibold border border-white/20">
          Was Live
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center group cursor-pointer">
      {/* Fake placeholder for actual streaming component, like WebRTC or HLS player */}
      <img src="https://images.unsplash.com/photo-1541844053589-346841d0b34c?q=80&w=1000&auto=format&fit=crop" alt="Live stream" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />
      
      <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-0.5 flex items-center gap-1.5 rounded-sm text-xs font-bold shadow-sm animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
        LIVE
      </div>

      <div className="absolute top-3 left-[70px] bg-black/60 backdrop-blur text-white px-2 py-0.5 flex items-center gap-1 rounded-sm text-xs font-bold">
        <Users className="w-3 h-3" />
        {liveInfo.viewer_count}
      </div>

      <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
        <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
      </div>
    </div>
  );
}
