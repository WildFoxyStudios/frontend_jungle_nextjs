"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@jungle/ui";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  title?: string;
  waveColor?: string;
}

export function AudioPlayer({ src, title, waveColor = "bg-primary" }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="flex items-center gap-3">
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 rounded-full shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </Button>

        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-medium truncate">{title}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
            <div className="flex-1 relative h-8 flex items-center">
              {/* Waveform visualization */}
              <div className="absolute inset-0 flex items-center gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => {
                  const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20;
                  const isActive = (i / 40) * duration <= currentTime;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all ${isActive ? waveColor : "bg-muted-foreground/20"}`}
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <input
                type="range"
                min={0}
                max={duration || 1}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
