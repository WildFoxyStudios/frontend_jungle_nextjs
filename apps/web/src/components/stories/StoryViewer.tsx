"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { Story } from "@jungle/api-client";
import { storiesApi } from "@jungle/api-client";
import { Avatar, AvatarImage, AvatarFallback, Button, Input } from "@jungle/ui";
import { X, ChevronLeft, ChevronRight, Pause, Play, Volume2, VolumeX, Send } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

const REACTIONS = ["❤️", "😮", "😂", "😢", "🔥", "👏"];

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [reacted, setReacted] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = stories[currentIndex];
  const durationMs = (current?.duration ?? 5) * 1000;

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (!current) return;
    storiesApi.viewStory(current.id).catch(() => { /* non-critical: failure is silent */ });
  }, [currentIndex, current]);

  useEffect(() => {
    if (!current || paused) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          goNext();
          return 0;
        }
        return p + (100 / (durationMs / 100));
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, current, durationMs, goNext, paused]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [goNext, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  if (!current) return null;

  const isVideo = current.media.type === "video";
  const publisher = current.publisher;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={onClose}>
      {/* Prev arrow */}
      {currentIndex > 0 && (
        <Button
          variant="ghost" size="icon"
          className="absolute left-4 text-white hover:bg-white/20 z-20"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      <div
        className="relative w-full max-w-sm h-full max-h-[90vh] bg-black rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
          {stories.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
              <div
                className="h-full bg-white transition-none"
                style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* User info */}
        {publisher && (
          <div className="absolute top-6 left-3 z-10 flex items-center gap-2">
            <Link href={`/profile/${publisher.username}`}>
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src={resolveAvatarUrl(publisher.avatar)} />
                <AvatarFallback>{publisher.first_name?.[0]}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${publisher.username}`} className="text-white text-sm font-semibold hover:underline">
                {publisher.first_name} {publisher.last_name}
              </Link>
              <p className="text-white/60 text-[10px]">{formatDistanceToNow(current.created_at)}</p>
            </div>
          </div>
        )}

        {/* Media */}
        {isVideo ? (
          <video
            ref={videoRef}
            src={current.media.url}
            className="w-full h-full object-contain"
            autoPlay
            muted={muted}
            playsInline
            onPause={() => setPaused(true)}
            onPlay={() => setPaused(false)}
          />
        ) : (
          <img src={current.media.url} alt="" className="w-full h-full object-contain" />
        )}

        {/* Text overlay */}
        {current.text && (
          <div className="absolute bottom-16 left-0 right-0 text-center px-4 z-10">
            <p className="text-white text-lg font-semibold drop-shadow-lg">{current.text}</p>
          </div>
        )}

        {/* Tap to navigate */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-1/3"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        />

        {/* Controls */}
        <div className="absolute top-6 right-3 z-20 flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setPaused((p) => !p)}>
            {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
          {isVideo && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setMuted((m) => !m)}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* View count */}
        <div className="absolute bottom-16 left-4 z-10 text-white/60 text-xs">
          {current.view_count ?? 0} views
        </div>

        {/* Reply & Reactions */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 space-y-2">
          <div className="flex justify-center gap-2">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={async () => {
                  try {
                    await storiesApi.reactToStory(current.id, emoji === reacted ? "" : emoji);
                    setReacted(emoji === reacted ? null : emoji);
                  } catch { /* silent */ }
                }}
                className={`text-xl transition-transform hover:scale-125 ${
                  reacted === emoji ? "scale-125" : "opacity-70 hover:opacity-100"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Send a reply…"
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm h-9"
              onFocus={() => setPaused(true)}
              onBlur={() => { if (!reply) setPaused(false); }}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && reply.trim()) {
                  setSendingReply(true);
                  try {
                    await storiesApi.replyToStory(current.id, reply);
                    setReply("");
                    setPaused(false);
                  } catch { /* silent */ }
                  finally { setSendingReply(false); }
                }
              }}
            />
            <Button
              size="sm" variant="ghost"
              className="text-white h-9 px-2"
              disabled={!reply.trim() || sendingReply}
              onClick={async () => {
                if (!reply.trim()) return;
                setSendingReply(true);
                try {
                  await storiesApi.replyToStory(current.id, reply);
                  setReply(""); setPaused(false);
                } catch { /* silent */ }
                finally { setSendingReply(false); }
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Next arrow */}
      {currentIndex < stories.length - 1 && (
        <Button
          variant="ghost" size="icon"
          className="absolute right-4 text-white hover:bg-white/20 z-20"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>
  );
}
