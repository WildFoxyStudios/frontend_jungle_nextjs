"use client";

import { useState } from "react";
import type { MediaItem } from "@jungle/api-client";
import { Button } from "@jungle/ui";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface GalleryProps {
  items: MediaItem[];
}

export function Gallery({ items }: GalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className={`grid gap-1 ${items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {items.slice(0, 9).map((item, i) => (
          <button
            key={item.id}
            onClick={() => setLightboxIndex(i)}
            className="relative aspect-square bg-muted rounded overflow-hidden"
          >
            {item.type === "image" ? (
              <img src={item.url} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <video src={item.url} className="w-full h-full object-cover" />
            )}
            {i === 8 && items.length > 9 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-xl">
                +{items.length - 9}
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxIndex(null)}>
          <div className="relative max-w-4xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={items[lightboxIndex].url}
              alt=""
              className="max-h-[80vh] w-auto object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {lightboxIndex > 0 && <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setLightboxIndex(lightboxIndex - 1)}><ChevronLeft className="h-4 w-4" /></Button>}
              {lightboxIndex < items.length - 1 && <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => setLightboxIndex(lightboxIndex + 1)}><ChevronRight className="h-4 w-4" /></Button>}
              <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => setLightboxIndex(null)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
