import { useState } from "react";
import type { MediaItem } from "@jungle/api-client";

interface PhotoMultiEmbedProps {
  media: MediaItem[];
  onPhotoClick?: (index: number) => void;
}

export function PhotoMultiEmbed({ media, onPhotoClick }: PhotoMultiEmbedProps) {
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(new Set());
  const count = media.length;

  const handleError = (idx: number) =>
    setFailedIndexes((prev) => new Set([...prev, idx]));

  const renderItem = (item: MediaItem, idx: number, className: string) => {
    if (failedIndexes.has(idx)) return null;
    const isVideo = item.type === "video";
    return (
      <div
        key={item.id ?? idx}
        className={`relative bg-muted overflow-hidden cursor-pointer ${className}`}
        onClick={() => onPhotoClick?.(idx)}
      >
        {isVideo ? (
          <video
            src={item.url}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={item.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={() => handleError(idx)}
          />
        )}
      </div>
    );
  };

  if (count === 1) {
    return (
      <div className="rounded-xl overflow-hidden">
        {renderItem(media[0], 0, "aspect-video w-full")}
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {media.map((item, idx) => renderItem(item, idx, "aspect-square"))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {renderItem(media[0], 0, "aspect-square row-span-2")}
        {renderItem(media[1], 1, "aspect-square")}
        {renderItem(media[2], 2, "aspect-square")}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-0.5 rounded-xl overflow-hidden">
        {media.map((item, idx) => renderItem(item, idx, "aspect-square"))}
      </div>
    );
  }

  // 5+ items: 2-column with overflow indicator on last visible
  const visible = media.slice(0, 5);
  const extra = count - 5;
  const lastItem = visible[4];
  const lastFailed = failedIndexes.has(4);
  const lastIsVideo = lastItem?.type === "video";
  return (
    <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
      {renderItem(visible[0], 0, "col-span-2 aspect-video")}
      {renderItem(visible[1], 1, "aspect-square")}
      {renderItem(visible[2], 2, "aspect-square")}
      {renderItem(visible[3], 3, "aspect-square")}
      <div
        key={lastItem?.id ?? 4}
        className="relative aspect-square bg-muted overflow-hidden cursor-pointer"
        onClick={() => onPhotoClick?.(4)}
      >
        {!lastFailed && lastItem && (
          lastIsVideo ? (
            <video
              src={lastItem.url}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={lastItem.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => handleError(4)}
            />
          )
        )}
        {extra > 0 && (
          <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
            <span className="text-white text-xl font-bold">+{extra}</span>
          </div>
        )}
      </div>
    </div>
  );
}
