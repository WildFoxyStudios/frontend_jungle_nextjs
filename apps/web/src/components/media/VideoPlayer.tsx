"use client";

import { MediaPlayer, MediaProvider } from "@vidstack/react";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
}

export function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
  return (
    <MediaPlayer src={src} poster={poster} title={title} className="w-full aspect-video">
      <MediaProvider />
    </MediaPlayer>
  );
}
