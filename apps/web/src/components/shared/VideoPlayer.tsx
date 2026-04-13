"use client";

import { useRef } from "react";
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
  onEnded?: () => void;
}

export function VideoPlayer({
  src,
  poster,
  title,
  autoPlay = false,
  muted = false,
  loop = false,
  className = "",
  onEnded,
}: VideoPlayerProps) {
  const playerRef = useRef<MediaPlayerInstance>(null);

  const isHLS = src.endsWith(".m3u8") || src.includes(".m3u8?");

  return (
    <MediaPlayer
      ref={playerRef}
      src={isHLS ? { src, type: "application/x-mpegurl" } : src}
      autoPlay={autoPlay}
      muted={muted}
      loop={loop}
      crossOrigin=""
      playsInline
      title={title}
      className={`w-full aspect-video overflow-hidden rounded-lg ${className}`}
      onEnded={onEnded}
    >
      <MediaProvider>
        {poster && <Poster className="vds-poster" src={poster} alt={title ?? ""} />}
      </MediaProvider>
      <DefaultVideoLayout icons={defaultLayoutIcons} />
    </MediaPlayer>
  );
}
