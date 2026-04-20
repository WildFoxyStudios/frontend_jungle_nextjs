"use client";

import { useCallback, useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Share2, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@jungle/ui";

export interface LightboxMedia {
  url: string;
  type: "image" | "video";
  alt?: string;
}

interface MediaLightboxProps {
  media: LightboxMedia[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function MediaLightbox({ media, initialIndex = 0, open, onClose }: MediaLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i > 0 ? i - 1 : media.length - 1));
      if (e.key === "ArrowRight") setIndex((i) => (i < media.length - 1 ? i + 1 : 0));
    },
    [open, media.length, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || media.length === 0) return null;

  const current = media[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed((z) => !z);
          }}
          aria-label="Zoom"
        >
          {zoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(current.url);
            toast.success("Link copied");
          }}
          aria-label="Share"
        >
          <Share2 className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            window.open(current.url, "_blank");
          }}
          aria-label="Download"
        >
          <Download className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {media.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm z-10">
          {index + 1} / {media.length}
        </div>
      )}

      {media.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 text-white hover:bg-white/20 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i > 0 ? i - 1 : media.length - 1));
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 text-white hover:bg-white/20 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setIndex((i) => (i < media.length - 1 ? i + 1 : 0));
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>
        </>
      )}

      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {current.type === "image" ? (
          <img
            src={current.url}
            alt={current.alt ?? ""}
            className={`object-contain transition-transform ${zoomed ? "max-w-none max-h-none scale-150 cursor-zoom-out" : "max-w-[90vw] max-h-[90vh] cursor-zoom-in"}`}
            onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
          />
        ) : (
          <video
            src={current.url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[90vh]"
          />
        )}
      </div>
    </div>
  );
}
