"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { storiesApi } from "@jungle/api-client";
import { Button, Input, Label, Progress, Textarea } from "@jungle/ui";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { ImagePlus, Palette, Sparkles, Type } from "lucide-react";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { toast } from "sonner";

/**
 * CSS filters applied to the story preview. The same string is persisted in
 * the backend's `filter` field and re-applied by StoryViewer so the viewer
 * sees exactly what the creator designed. Plan §3.3 — S3.
 */
const FILTER_PRESETS: Array<{ id: string; label: string; css: string }> = [
 { id: "none", label: "Original", css: "none" },
 { id: "bw", label: "B&W", css: "grayscale(1)" },
 { id: "sepia", label: "Sepia", css: "sepia(0.9)" },
 { id: "warm", label: "Warm", css: "saturate(1.3) hue-rotate(-15deg) brightness(1.05)" },
 { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(15deg) brightness(0.95)" },
 { id: "vintage", label: "Vintage", css: "sepia(0.4) contrast(1.1) brightness(0.95)" },
 { id: "vivid", label: "Vivid", css: "saturate(1.6) contrast(1.1)" },
 { id: "muted", label: "Muted", css: "saturate(0.65)" },
];

/** Text-overlay preset styles applied via a single CSS string. Plan §3.3 — S2. */
const TEXT_STYLES: Array<{ id: string; label: string; color: string; fontFamily: string }> = [
 { id: "classic", label: "Classic", color: "#ffffff", fontFamily: "system-ui, sans-serif" },
 { id: "serif", label: "Serif", color: "#ffffff", fontFamily: "Georgia, serif" },
 { id: "mono", label: "Mono", color: "#ffe066", fontFamily: "ui-monospace, monospace" },
 { id: "neon", label: "Neon", color: "#22d3ee", fontFamily: "system-ui, sans-serif" },
 { id: "rose", label: "Rose", color: "#fb7185", fontFamily: "system-ui, sans-serif" },
];

interface StoryCreatorProps {
 onSuccess?: () => void;
}

export function StoryCreator({ onSuccess }: StoryCreatorProps) {
 const [file, setFile] = useState<File | null>(null);
 const [description, setDescription] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [filterId, setFilterId] = useState<string>("none");
 const [textStyleId, setTextStyleId] = useState<string>("classic");
 const {
 uploadProcessedMedia, isBusy, isProcessing, isUploading,
 processingProgress, uploadProgress, compressionInfo,
 } = useAdvancedMediaUpload();
 const fileRef = useRef<HTMLInputElement>(null);
 const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
 const isVideo = file?.type.startsWith("video/") ?? false;

 const activeFilter = FILTER_PRESETS.find((f) => f.id === filterId) ?? FILTER_PRESETS[0]!;
 const activeTextStyle = TEXT_STYLES.find((s) => s.id === textStyleId) ?? TEXT_STYLES[0]!;

 useEffect(() => {
 return () => {
 if (previewUrl) {
 URL.revokeObjectURL(previewUrl);
 }
 };
 }, [previewUrl]);

 const handleSubmit = async () => {
 if (!file) return;
 setIsLoading(true);
 try {
 const media = await uploadProcessedMedia(file, {
 imageOptions: { maxWidth: 1080, maxSizeMB: 2 },
 videoOptions: { maxDurationSec: 30, maxSizeMB: 30 },
 });
 if (!media) throw new Error("Upload failed");
 const fd = new FormData();
 fd.append("media_id", String(media.id));
 if (description.trim()) {
 fd.append("description", description.trim());
 }
 // S2/S3 — persist filter + text style so viewers see the same design.
 // Backend stores these as opaque metadata; viewer applies them as CSS.
 if (filterId !== "none") {
 fd.append("filter_css", activeFilter.css);
 }
 if (description.trim() && textStyleId !== "classic") {
 fd.append("text_style_color", activeTextStyle.color);
 fd.append("text_style_font", activeTextStyle.fontFamily);
 }
 await storiesApi.createStory(fd);
 toast.success("Story shared!");
 setFile(null);
 setDescription("");
 setFilterId("none");
 setTextStyleId("classic");
 if (fileRef.current) {
 fileRef.current.value = "";
 }
 onSuccess?.();
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to share story");
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <div className="space-y-5">
 <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
 <button
 type="button"
 onClick={() => fileRef.current?.click()}
 className="group relative w-full min-h-[200px] rounded-lg overflow-hidden flex flex-col items-center justify-center bg-surface-subtle border-2 border-dashed border-border transition-colors hover:bg-surface-raised"
 >
 {previewUrl ? (
 <>
 {isVideo ? (
 <video
 src={previewUrl}
 className="absolute inset-0 h-full w-full object-cover"
 style={{ filter: activeFilter.css }}
 muted
 playsInline
 />
 ) : (
 <Image
 src={previewUrl}
 alt=""
 fill
 unoptimized
 className="object-cover"
 style={{ filter: activeFilter.css }}
 />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
 {/* S2 — live text overlay preview */}
 {description.trim() && (
 <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
 <p
 className="inline-block whitespace-pre-wrap px-3 py-1 text-lg font-semibold leading-snug"
 style={{
 color: activeTextStyle.color,
 fontFamily: activeTextStyle.fontFamily,
 textShadow: "0 1px 4px rgba(0,0,0,0.6)",
 }}
 >
 {description}
 </p>
 </div>
 )}
 <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
 <div>
 <p className="line-clamp-1 text-sm font-medium">{file?.name}</p>
 <p className="text-xs text-white/75">
 {isVideo ? "Video story" : "Photo story"}
 </p>
 </div>
 <span className="border border-white/70 bg-black/50 px-3 py-1 text-[13px] font-medium text-white backdrop-blur">
 Change
 </span>
 </div>
 </>
 ) : (
 <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
 <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
 <ImagePlus className="h-4 w-4" />
 </div>
 <div>
 <p className="text-xs mt-2 font-medium">Drop a photo or video</p>
 </div>
 </div>
 )}
 </button>

 <div className="space-y-4 rounded-lg bg-muted/40 p-4">
 <div className="space-y-1">
 <Label htmlFor="story-file">Photo or video</Label>
 <Input
 id="story-file" ref={fileRef}
 type="file"
 accept="image/*,video/*"
 onChange={(e) => setFile(e.target.files?.[0] ?? null)}
 />
 <p className="text-xs text-muted-foreground">
 Share one story at a time. Photos stay lightweight and videos are optimized before upload.
 </p>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label htmlFor="story-description">Caption</Label>
 {/* S1 — Emoji sticker picker */}
 <EmojiPicker
 onEmojiSelect={(emoji) => setDescription((prev) => prev + emoji)}
 triggerClassName="h-7 px-2"
 />
 </div>
 <Textarea
 id="story-description"
 rows={3}
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="What's going on?"
 className="resize-none"
 />
 </div>

 {/* S2 — Text style picker (only when caption present) */}
 {description.trim() && (
 <div className="space-y-2">
 <Label className="flex items-center gap-1.5 text-xs">
 <Type className="h-3.5 w-3.5" /> Text style
 </Label>
 <div className="flex flex-wrap gap-1.5">
 {TEXT_STYLES.map((style) => (
 <button
 key={style.id}
 type="button"
 onClick={() => setTextStyleId(style.id)}
 className={`border px-2 py-1 text-[13px] font-medium transition-colors ${
 textStyleId === style.id
 ? "border-primary bg-primary/15"
 : "border-foreground hover:bg-secondary/60"
 }`}
 style={{ color: style.color, fontFamily: style.fontFamily, background: "rgba(0,0,0,0.35)" }}
 >
 Aa · {style.label}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* S3 — Filter picker */}
 {previewUrl && (
 <div className="space-y-2">
 <Label className="flex items-center gap-1.5 text-xs">
 <Palette className="h-3.5 w-3.5" /> Filter
 </Label>
 <div className="grid grid-cols-4 gap-1.5">
 {FILTER_PRESETS.map((preset) => (
 <button
 key={preset.id}
 type="button"
 onClick={() => setFilterId(preset.id)}
 className={`relative aspect-square overflow-hidden border transition-colors ${
 filterId === preset.id
 ? "border-primary"
 : "border-border hover:bg-muted/30"
 }`}
 title={preset.label}
 >
 {!isVideo ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={previewUrl}
 alt={preset.label}
 className="h-full w-full object-cover"
 style={{ filter: preset.css }}
 />
 ) : (
 <video
 src={previewUrl}
 className="h-full w-full object-cover"
 style={{ filter: preset.css }}
 muted
 playsInline
 />
 )}
 <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1 pb-0.5 pt-3 text-[9px] text-white">
 {preset.label}
 </span>
 </button>
 ))}
 </div>
 </div>
 )}

 <div className="bg-muted/40 p-3 text-sm">
 <div className="flex items-center gap-2 font-semibold">
 <Sparkles className="h-4 w-4 text-primary" />
 Story tips
 </div>
 <p className="mt-1 text-muted-foreground">
 Keep the caption short so the media stays front and center, like in Sunshine.
 </p>
 </div>
 </div>
 </div>
 {isBusy && (
 <div className="space-y-1">
 {isProcessing && (
 <div>
 <p className="text-xs text-muted-foreground">Optimizing… {processingProgress}%</p>
 <Progress value={processingProgress} className="h-1" />
 </div>
 )}
 {isUploading && (
 <div>
 <p className="text-xs text-muted-foreground">
 Uploading… {uploadProgress}%
 {compressionInfo && compressionInfo.savedPercent > 0 && (
 <span className="text-green-600 ml-1">(saved {compressionInfo.savedPercent}%)</span>
 )}
 </p>
 <Progress value={uploadProgress} className="h-1" />
 </div>
 )}
 </div>
 )}
 <Button
 onClick={handleSubmit}
 disabled={!file || isLoading || isBusy}
 className="w-full"
 >
 {isBusy ? (isProcessing ? "Optimizing…" : "Uploading…") : "Share story"}
 </Button>
 </div>
 );
}
