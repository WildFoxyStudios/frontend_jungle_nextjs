import Image from "next/image";
import { useState } from "react";
import type { MediaItem } from "@jungle/api-client";
import { Play } from "lucide-react";

interface PhotoMultiEmbedProps {
 media: MediaItem[];
 onPhotoClick?: (index: number) => void;
 /** When true, marks the first image as priority for LCP. Use for the first post above-the-fold. */
 priority?: boolean;
}

export function PhotoMultiEmbed({ media, onPhotoClick, priority = false }: PhotoMultiEmbedProps) {
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
 className={`group relative cursor-pointer overflow-hidden bg-black/5 dark:bg-white/5 ${className}`}
 onClick={() => onPhotoClick?.(idx)}
 >
 {isVideo ? (
 <video
 src={item.url}
 className="h-full w-full object-cover"
 muted
 playsInline
 />
 ) : (
 <Image
 src={item.url}
 alt=""
 fill
 unoptimized
 sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 600px"
 priority={priority && idx === 0}
 className="object-cover transition-transform duration-300 group-hover:scale-105"
 onError={() => handleError(idx)}
 />
 )}
 {isVideo && (
 <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
 <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white">
 <Play className="ml-0.5 h-5 w-5 fill-current" />
 </span>
 </div>
 )}
 </div>
 );
 };

 const shared = "-mx-4 sm:-mx-5";

 if (count === 1) {
 return (
 <div className={`overflow-hidden bg-black/5 dark:bg-white/5 ${shared}`}>
 {renderItem(media[0], 0, "aspect-[4/5] w-full md:aspect-[16/10]")}
 </div>
 );
 }

 if (count === 2) {
 return (
 <div className={`grid grid-cols-2 gap-px overflow-hidden bg-black/5 dark:bg-white/5 ${shared}`}>
 {media.map((item, idx) => renderItem(item, idx, "aspect-square"))}
 </div>
 );
 }

 if (count === 3) {
 return (
 <div className={`grid grid-cols-2 gap-px overflow-hidden bg-black/5 dark:bg-white/5 ${shared}`}>
 {renderItem(media[0], 0, "aspect-square row-span-2")}
 {renderItem(media[1], 1, "aspect-square")}
 {renderItem(media[2], 2, "aspect-square")}
 </div>
 );
 }

 if (count === 4) {
 return (
 <div className={`grid grid-cols-2 gap-px overflow-hidden bg-black/5 dark:bg-white/5 ${shared}`}>
 {media.map((item, idx) => renderItem(item, idx, "aspect-square"))}
 </div>
 );
 }

 // 5+ items: 3-column with overflow indicator on last visible
 const visible = media.slice(0, 5);
 const extra = count - 5;
 const lastItem = visible[4];
 const lastFailed = failedIndexes.has(4);
 const lastIsVideo = lastItem?.type === "video";
 return (
 <div className={`grid grid-cols-3 gap-px overflow-hidden bg-black/5 dark:bg-white/5 ${shared}`}>
 {renderItem(visible[0], 0, "col-span-2 aspect-video")}
 {renderItem(visible[1], 1, "aspect-square")}
 {renderItem(visible[2], 2, "aspect-square")}
 {renderItem(visible[3], 3, "aspect-square")}
 <div
 key={lastItem?.id ?? 4}
 className="relative aspect-square cursor-pointer overflow-hidden bg-black/5 dark:bg-white/5"
 onClick={() => onPhotoClick?.(4)}
 >
 {!lastFailed && lastItem && (
 lastIsVideo ? (
 <video
 src={lastItem.url}
 className="h-full w-full object-cover"
 muted
 playsInline
 />
 ) : (
 <Image
 src={lastItem.url}
 alt=""
 fill
 unoptimized
 sizes="(max-width: 640px) 33vw, 200px"
 className="object-cover transition-transform duration-300 hover:scale-105"
 onError={() => handleError(4)}
 />
 )
 )}
 {extra > 0 && (
 <div className="absolute inset-0 flex items-center justify-center bg-black/60">
 <span className="text-xl font-bold text-white">
 +{extra}
 </span>
 </div>
 )}
 </div>
 </div>
 );
}
