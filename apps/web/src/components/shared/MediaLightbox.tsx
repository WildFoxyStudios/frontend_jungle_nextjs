"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
 X,
 ChevronLeft,
 ChevronRight,
 Download,
 Share2,
 ZoomIn,
 ZoomOut,
 RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@jungle/ui";
import { mediaApi } from "@jungle/api-client";

export interface LightboxMedia {
 /** Media id (uploaded_media.id). When provided + type === "image" the
 * rotate-in-place button is enabled and posts the new URL back via
 * `onMediaChange`. */
 id?: number;
 url: string;
 type: "image" | "video";
 alt?: string;
}

interface MediaLightboxProps {
 media: LightboxMedia[];
 initialIndex?: number;
 open: boolean;
 onClose: () => void;
 /** Optional callback fired after the user rotates an image in place;
 * receives the index and the updated URL so the parent can re-fetch
 * or replace the cached entry. */
 onMediaChange?: (index: number, next: LightboxMedia) => void;
}

export function MediaLightbox({ media, initialIndex = 0, open, onClose, onMediaChange }: MediaLightboxProps) {
 const [index, setIndex] = useState(initialIndex);
 const [zoomed, setZoomed] = useState(false);
 const [rotating, setRotating] = useState(false);
 const [overrideUrl, setOverrideUrl] = useState<string | null>(null);

 useEffect(() => {
 if (open) {
 setIndex(initialIndex);
 setOverrideUrl(null);
 }
 }, [open, initialIndex]);

 useEffect(() => {
 setOverrideUrl(null);
 }, [index]);

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
 if (!current) return null;
 const displayUrl = overrideUrl ?? current.url;
 const canRotate = current.type === "image" && typeof current.id === "number";

 async function rotate() {
 if (!current || typeof current.id !== "number" || rotating) return;
 setRotating(true);
 try {
 const result = await mediaApi.rotateMedia(current.id, 90);
 const cacheBusted = `${result.file_url}?v=${Date.now()}`;
 setOverrideUrl(cacheBusted);
 onMediaChange?.(index, { ...current, url: cacheBusted });
 toast.success("Image rotated");
 } catch {
 toast.error("Could not rotate image");
 } finally {
 setRotating(false);
 }
 }

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
 {canRotate && (
 <Button
 variant="ghost"
 size="icon"
 className="text-white hover:bg-white/20"
 disabled={rotating}
 onClick={(e) => {
 e.stopPropagation();
 void rotate();
 }}
 aria-label="Rotate"
 >
 <RotateCw className={`h-5 w-5 ${rotating ? "animate-spin" : ""}`} />
 </Button>
 )}
 <Button
 variant="ghost"
 size="icon"
 className="text-white hover:bg-white/20"
 onClick={(e) => {
 e.stopPropagation();
 navigator.clipboard.writeText(displayUrl);
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
 window.open(displayUrl, "_blank");
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
 <Image
 src={displayUrl}
 alt={current.alt ?? ""}
 width={1600}
 height={1200}
 unoptimized
 className={`object-contain transition-transform ${zoomed ? "max-w-none max-h-none scale-150 cursor-zoom-out" : "max-w-[90vw] max-h-[90vh] cursor-zoom-in"}`}
 onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
 />
 ) : (
 <video
 src={displayUrl}
 controls
 autoPlay
 className="max-w-[90vw] max-h-[90vh]"
 />
 )}
 </div>
 </div>
 );
}
