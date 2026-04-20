"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { mediaApi } from "@jungle/api-client";
import type { Album, AlbumImage } from "@jungle/api-client";
import {
  Skeleton, Badge, Avatar, AvatarFallback, AvatarImage, Button,
  Dialog, DialogContent,
} from "@jungle/ui";
import { resolveAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import { ImageIcon, Calendar, ChevronLeft, ChevronRight, X, Download } from "lucide-react";

interface Props { params: Promise<{ id: string }> }

export default function AlbumDetailPage({ params }: Props) {
  const { id } = use(params);
  const [album, setAlbum] = useState<(Album & { images: AlbumImage[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    mediaApi.getAlbum(Number(id))
      .then(setAlbum)
      .catch(() => toast.error("Failed to load album"))
      .finally(() => setLoading(false));
  }, [id]);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  const goNext = useCallback(() => {
    if (lightboxIdx === null || !album) return;
    setLightboxIdx((lightboxIdx + 1) % album.images.length);
  }, [lightboxIdx, album]);

  const goPrev = useCallback(() => {
    if (lightboxIdx === null || !album) return;
    setLightboxIdx((lightboxIdx - 1 + album.images.length) % album.images.length);
  }, [lightboxIdx, album]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIdx, goNext, goPrev]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded" />)}
        </div>
      </div>
    );
  }

  if (!album) return <p className="text-center text-muted-foreground mt-8">Album not found.</p>;

  const currentImage = lightboxIdx !== null ? album.images[lightboxIdx] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{album.name}</h1>
        {album.description && <p className="text-sm text-muted-foreground">{album.description}</p>}

        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <Link href={`/profile/${album.owner.username}`} className="flex items-center gap-2 hover:text-foreground">
            <Avatar className="h-7 w-7">
              <AvatarImage src={resolveAvatarUrl(album.owner.avatar)} />
              <AvatarFallback className="text-xs">{album.owner.first_name?.[0]}</AvatarFallback>
            </Avatar>
            <span>{album.owner.first_name} {album.owner.last_name}</span>
          </Link>
          <span className="flex items-center gap-1">
            <ImageIcon className="h-3.5 w-3.5" /> {album.image_count} photos
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> {new Date(album.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Grid */}
      {album.images.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No photos in this album.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {album.images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => openLightbox(i)}
              className="relative aspect-square bg-muted rounded overflow-hidden group"
            >
              <img src={img.url} alt={img.caption ?? ""} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{img.caption}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxIdx !== null} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black/95 border-0">
          {currentImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.caption ?? ""}
                className="max-w-full max-h-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />

              {/* Controls */}
              <button onClick={closeLightbox} className="absolute top-3 right-3 text-white/80 hover:text-white z-10">
                <X className="h-6 w-6" />
              </button>

              {album.images.length > 1 && (
                <>
                  <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-10">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 z-10">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Bottom bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 z-10">
                <div className="flex items-center justify-between">
                  <div>
                    {currentImage.caption && <p className="text-white text-sm">{currentImage.caption}</p>}
                    <p className="text-white/60 text-xs">{(lightboxIdx ?? 0) + 1} / {album.images.length}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-white" asChild>
                    <a href={currentImage.url} download target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
