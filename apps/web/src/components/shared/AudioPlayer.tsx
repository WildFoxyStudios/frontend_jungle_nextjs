"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@jungle/ui";
import { Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useAudioWaveform } from "@/hooks/use-audio-waveform";

interface AudioPlayerProps {
 src: string;
 title?: string;
 /** Tailwind class for the active (played) part of the waveform. */
 waveColor?: string;
 /** Tailwind class for the unplayed part of the waveform. */
 inactiveColor?: string;
 /** Number of bars in the visualisation. Defaults to 48. */
 bars?: number;
}

/**
 * Voice-note / audio player with a real PCM-derived waveform.
 *
 * The waveform is computed once per `src` from the decoded audio (Web Audio
 * API, `useAudioWaveform`). We never render `Math.random()` peaks — the
 * visual matches what the user is actually hearing.
 *
 * - Click on any bar (or drag the invisible range slider) to seek.
 * - Keyboard friendly: the slider keeps focus and accepts arrow keys.
 * - While the file decodes we show a deterministic placeholder shape so
 * the layout doesn't jump.
 */
export function AudioPlayer({
 src,
 title,
 waveColor = "bg-primary",
 inactiveColor = "bg-muted-foreground/25",
 bars = 48,
}: AudioPlayerProps) {
 const audioRef = useRef<HTMLAudioElement>(null);
 const [isPlaying, setIsPlaying] = useState(false);
 const [currentTime, setCurrentTime] = useState(0);
 const [duration, setDuration] = useState(0);
 const [isMuted, setIsMuted] = useState(false);

 const { peaks, loading: waveLoading } = useAudioWaveform(src, bars);

 useEffect(() => {
 const audio = audioRef.current;
 if (!audio) return;

 const updateTime = () => setCurrentTime(audio.currentTime);
 const updateDuration = () => setDuration(audio.duration || 0);
 const handlePlay = () => setIsPlaying(true);
 const handlePause = () => setIsPlaying(false);
 const handleEnded = () => {
 setIsPlaying(false);
 setCurrentTime(0);
 };

 audio.addEventListener("timeupdate", updateTime);
 audio.addEventListener("loadedmetadata", updateDuration);
 audio.addEventListener("durationchange", updateDuration);
 audio.addEventListener("play", handlePlay);
 audio.addEventListener("pause", handlePause);
 audio.addEventListener("ended", handleEnded);

 return () => {
 audio.removeEventListener("timeupdate", updateTime);
 audio.removeEventListener("loadedmetadata", updateDuration);
 audio.removeEventListener("durationchange", updateDuration);
 audio.removeEventListener("play", handlePlay);
 audio.removeEventListener("pause", handlePause);
 audio.removeEventListener("ended", handleEnded);
 };
 }, []);

 const togglePlay = async () => {
 const audio = audioRef.current;
 if (!audio) return;
 if (audio.paused) {
 try {
 await audio.play();
 } catch {
 // Browser may block autoplay until user gesture; nothing to do.
 }
 } else {
 audio.pause();
 }
 };

 const toggleMute = () => {
 const audio = audioRef.current;
 if (!audio) return;
 const next = !isMuted;
 audio.muted = next;
 setIsMuted(next);
 };

 const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
 const audio = audioRef.current;
 if (!audio) return;
 const newTime = parseFloat(e.target.value);
 if (Number.isFinite(newTime)) {
 audio.currentTime = newTime;
 setCurrentTime(newTime);
 }
 };

 const progress = useMemo(() => {
 if (!duration || !Number.isFinite(duration)) return 0;
 return Math.min(1, Math.max(0, currentTime / duration));
 }, [currentTime, duration]);

 const formatTime = (time: number) => {
 if (!Number.isFinite(time)) return "0:00";
 const mins = Math.floor(time / 60);
 const secs = Math.floor(time % 60);
 return `${mins}:${secs.toString().padStart(2, "0")}`;
 };

 return (
 <div className="space-y-3 border rounded-lg bg-secondary-soft p-3 sm:p-4">
 <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />

 <div className="flex items-center gap-3">
 <Button
 type="button"
 variant="default"
 size="icon"
 className="h-11 w-11 rounded-full shrink-0"
 onClick={togglePlay}
 aria-label={isPlaying ? "Pause" : "Play"}
 >
 {isPlaying ? (
 <Pause className="h-5 w-5" />
 ) : (
 <Play className="h-5 w-5 ml-0.5" />
 )}
 </Button>

 <div className="flex-1 min-w-0">
 {title && (
 <p className="text-sm font-medium truncate text-foreground">{title}</p>
 )}
 <div className="mt-1 flex items-center gap-2">
 <span className="w-10 text-[13px] font-medium tabular-nums text-muted-foreground">
 {formatTime(currentTime)}
 </span>
 <div className="relative flex h-9 flex-1 items-center">
 <div
 aria-hidden="true"
 className="absolute inset-0 flex items-center gap-[2px]"
 >
 {peaks.map((amp, i) => {
 const isActive = i / peaks.length <= progress;
 const heightPct = Math.round(20 + amp * 80);
 return (
 <span
 key={i}
 className={[
 "flex-1 rounded-full transition-[height,background-color] duration-150",
 isActive ? waveColor : inactiveColor,
 waveLoading ? "opacity-70" : "opacity-100",
 ].join(" ")}
 style={{ height: `${heightPct}%` }}
 />
 );
 })}
 </div>
 {waveLoading && (
 <Loader2
 aria-hidden="true"
 className="pointer-events-none absolute right-1 h-3 w-3 animate-spin text-muted-foreground"
 />
 )}
 <input
 type="range"
 min={0}
 max={duration > 0 ? duration : 1}
 step="any"
 value={currentTime}
 onChange={handleSeek}
 aria-label="Seek"
 className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
 />
 </div>
 <span className="w-10 text-right text-[13px] font-medium tabular-nums text-muted-foreground">
 {formatTime(duration)}
 </span>
 </div>
 </div>

 <Button
 type="button"
 variant="ghost"
 size="icon"
 className="h-8 w-8 shrink-0"
 onClick={toggleMute}
 aria-label={isMuted ? "Unmute" : "Mute"}
 >
 {isMuted ? (
 <VolumeX className="h-4 w-4" />
 ) : (
 <Volume2 className="h-4 w-4" />
 )}
 </Button>
 </div>
 </div>
 );
}
