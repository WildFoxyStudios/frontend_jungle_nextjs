"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Radio, Loader2 } from "lucide-react";

interface HlsPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onError?: (err: string) => void;
  /** Show a "Live" badge + connecting spinner. */
  isLive?: boolean;
}

/**
 * HLS video player with native support (Safari/iOS) and hls.js fallback.
 *
 * Automatically selects the right path:
 * - Native HLS: sets `video.src = url` directly (Safari, iOS).
 * - hls.js: loads manifest, attaches to video element, handles buffer/errors.
 *
 * Non-HLS URLs (.mp4/.webm) are passed through as normal `<video>` sources.
 */
export function HlsPlayer({
  src,
  poster,
  autoPlay = true,
  muted = false,
  controls = true,
  className = "",
  onPlay,
  onPause,
  onEnded,
  onError,
  isLive = false,
}: HlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = src.endsWith(".m3u8") || src.includes(".m3u8?");

    // Cleanup previous hls.js instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setHasError(false);
    setIsLoading(true);

    if (!isHls) {
      // Plain mp4/webm/ogg
      video.src = src;
      return;
    }

    // Native HLS (Safari + iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      const onLoaded = () => setIsLoading(false);
      video.addEventListener("loadedmetadata", onLoaded);
      return () => video.removeEventListener("loadedmetadata", onLoaded);
    }

    // hls.js fallback (Chrome/Firefox/Edge)
    if (Hls.isSupported()) {
      const hls = new Hls({
        // Conservative, production-ready defaults
        enableWorker: true,
        lowLatencyMode: isLive,
        backBufferLength: isLive ? 30 : 90,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setHasError(true);
              onError?.(data.details);
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Last-resort fallback
    video.src = src;
    setHasError(true);
    onError?.("HLS not supported in this browser");
  }, [src, isLive, onError]);

  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        controls={controls}
        playsInline
        onPlay={() => {
          setIsLoading(false);
          onPlay?.();
        }}
        onPause={onPause}
        onEnded={onEnded}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
      />

      {isLive && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md pointer-events-none">
          <Radio className="h-3 w-3 animate-pulse" />
          LIVE
        </div>
      )}

      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-sm">
          Stream unavailable
        </div>
      )}
    </div>
  );
}
