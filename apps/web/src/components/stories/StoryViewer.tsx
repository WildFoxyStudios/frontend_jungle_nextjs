"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { Story } from "@jungle/api-client";
import { storiesApi } from "@jungle/api-client";
import { Button } from "@jungle/ui";
import { X } from "lucide-react";

interface StoryViewerProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

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
    storiesApi.viewStory(current.id).catch(() => {});
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
  }, [currentIndex, current, durationMs, goNext]);

  if (!current) return null;

  const isVideo = current.media.type === "video";

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full max-h-[90vh] bg-black rounded-lg overflow-hidden">
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

        {/* Media */}
        {isVideo ? (
          <video src={current.media.url} className="w-full h-full object-contain" autoPlay muted />
        ) : (
          <Image src={current.media.url} alt="" fill className="object-contain" />
        )}

        {/* Navigation */}
        <button onClick={goPrev} className="absolute left-0 top-0 bottom-0 w-1/3" />
        <button onClick={goNext} className="absolute right-0 top-0 bottom-0 w-1/3" />

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
