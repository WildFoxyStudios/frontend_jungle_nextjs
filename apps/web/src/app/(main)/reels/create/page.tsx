"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { mediaApi } from "@jungle/api-client";
import {
 Button,
 Card,
 CardContent,
 CardHeader,
 CardTitle,
 Textarea,
 Progress,
 Label,
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@jungle/ui";
import { Film, Upload, X, ArrowLeft, Image as ImageIcon } from "lucide-react";
import type { MediaItem, ReelAudioTrackSummary } from "@jungle/api-client";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateReelPage() {
 const router = useRouter();
 const inputRef = useRef<HTMLInputElement>(null);
 const [file, setFile] = useState<File | null>(null);
 const [preview, setPreview] = useState<string | null>(null);
 const [caption, setCaption] = useState("");
 const [progress, setProgress] = useState(0);
 const [uploading, setUploading] = useState(false);
 const [privacy, setPrivacy] = useState<"everyone" | "followers" | "only_me">("everyone");
 const [allowComments, setAllowComments] = useState(true);
 const [coverFramePct, setCoverFramePct] = useState(0);
 const [customCover, setCustomCover] = useState<MediaItem | null>(null);
 const [trendingAudio, setTrendingAudio] = useState<ReelAudioTrackSummary[]>([]);
 const [audioSearch, setAudioSearch] = useState("");
 const [audioSearchHits, setAudioSearchHits] = useState<ReelAudioTrackSummary[]>([]);
 const [selectedAudioId, setSelectedAudioId] = useState<number | undefined>();
 const [allowRemix, setAllowRemix] = useState(true);
 const coverCanvasRef = useRef<HTMLCanvasElement>(null);
 const coverVideoRef = useRef<HTMLVideoElement>(null);

 useEffect(() => {
 void (async () => {
 try {
 const list = await mediaApi.getReelAudioTrending();
 setTrendingAudio(Array.isArray(list) ? list.slice(0, 20) : []);
 } catch {
 setTrendingAudio([]);
 }
 })();
 }, []);

 const runAudioSearch = useCallback(async () => {
 const q = audioSearch.trim();
 if (q.length < 2) {
 setAudioSearchHits([]);
 return;
 }
 try {
 const hits = await mediaApi.searchReelAudio(q);
 setAudioSearchHits(Array.isArray(hits) ? hits : []);
 } catch {
 setAudioSearchHits([]);
 }
 }, [audioSearch]);

 function validateVideoMeta(url: string): Promise<void> {
 return new Promise((resolve, reject) => {
 const v = document.createElement("video");
 v.preload = "metadata";
 v.muted = true;
 v.src = url;
 v.onloadedmetadata = () => {
 const w = v.videoWidth;
 const h = v.videoHeight;
 if (w > 0 && h > 0) {
 const ar = w / h;
 const want = 9 / 16;
 if (Math.abs(ar - want) > 0.1) {
 reject(new Error("Reels work best in 9:16 (vertical). Please crop or re-record."));
 return;
 }
 }
 if (Number.isFinite(v.duration) && v.duration > 60) {
 reject(new Error("Video must be 60 seconds or less"));
 return;
 }
 resolve();
 };
 v.onerror = () => reject(new Error("Could not read video"));
 });
 }

 const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
 const f = e.target.files?.[0];
 if (!f) return;
 if (!f.type.startsWith("video/")) { toast.error("Please select a video file"); return; }
 if (f.size > 100 * 1024 * 1024) { toast.error("Video must be under 100 MB"); return; }
 setFile(f);
 setPreview(URL.createObjectURL(f));
 setCustomCover(null);
 setCoverFramePct(0);
 };

 const seekCoverPreview = (pct: number) => {
 setCoverFramePct(pct);
 const v = coverVideoRef.current;
 if (v && Number.isFinite(v.duration) && v.duration > 0) {
 v.currentTime = (pct / 100) * v.duration;
 }
 };

 const captureCustomCover = async () => {
 const v = coverVideoRef.current;
 const c = coverCanvasRef.current;
 if (!v || !c || v.videoWidth < 2) {
 toast.error("Wait for the video to load, then try again");
 return;
 }
 c.width = v.videoWidth;
 c.height = v.videoHeight;
 const ctx = c.getContext("2d");
 if (!ctx) return;
 ctx.drawImage(v, 0, 0, c.width, c.height);
 const blob: Blob | null = await new Promise((res) => {
 c.toBlob((b) => res(b), "image/jpeg", 0.88);
 });
 if (!blob) {
 toast.error("Could not capture frame");
 return;
 }
 setUploading(true);
 setProgress(0);
 try {
 const fd = new FormData();
 fd.append("file", new File([blob], "reel-cover.jpg", { type: "image/jpeg" }));
 const up = await mediaApi.uploadMedia(fd, setProgress);
 const item = (up as { data?: unknown }).data ?? (up as unknown);
 setCustomCover(item as MediaItem);
 toast.success("Custom cover set");
 } catch (e) {
 toast.error(e instanceof Error ? e.message : "Cover upload failed");
 } finally {
 setUploading(false);
 }
 };

 const handleSubmit = async () => {
 if (!file) { toast.error("Select a video first"); return; }
 if (!preview) return;
 setUploading(true);
 try {
 await validateVideoMeta(preview);
 // Step 1 — upload the raw video to the media service. The Rust backend
 // handles transcoding/thumbnails and returns a `MediaRow` we can embed
 // as the reel's media. The handler reads the field `file`.
 const fd = new FormData();
 fd.append("file", file);
 const uploaded = await mediaApi.uploadMedia(fd, setProgress);
 // Handlers return `{ data: MediaRow }`; `api.upload()` unwraps the envelope
 // when it's a single-key object, but we defensively handle both shapes.
 const mediaItemRaw =
 (uploaded as { data?: unknown }).data ?? (uploaded as unknown);
 const mediaItem = { ...(mediaItemRaw as MediaItem) };
 if (customCover) {
 const u = customCover.file_url ?? customCover.url;
 if (u) {
 mediaItem.thumbnail = u;
 mediaItem.thumbnail_url = u;
 }
 }

 // Step 2 — create the reel post referencing the uploaded media. The
 // backend expects JSON (`content`, `media`), matching the posts handler.
 await mediaApi.createReel({
 content: caption,
 media: [mediaItem],
 privacy,
 comments_status: allowComments ? 0 : 1,
 ...(selectedAudioId != null ? { audio_track_id: selectedAudioId } : {}),
 allow_remix: allowRemix,
 });
 toast.success("Reel published!");
 router.push("/reels");
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Upload failed");
 } finally {
 setUploading(false);
 }
 };

 return (
 <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
 <div className="flex items-center gap-3">
 <Button variant="ghost" size="icon" asChild>
 <Link href="/reels"><ArrowLeft className="h-5 w-5" /></Link>
 </Button>
 <h1 className="text-2xl font-bold">Create Reel</h1>
 </div>

 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2"><Film className="h-5 w-5" /> Upload Video</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 {!preview ? (
 <button
 onClick={() => inputRef.current?.click()}
 className="flex aspect-[9/16] max-h-80 w-full flex-col items-center justify-center gap-3 border border-dashed border-foreground transition-colors hover:bg-muted/50"
 >
 <Upload className="h-10 w-10 text-muted-foreground" />
 <p className="text-sm text-muted-foreground text-center">
 Click to upload a video<br />
 <span className="text-xs">MP4, WebM, MOV — max 100 MB</span>
 </p>
 </button>
 ) : (
 <div className="relative aspect-[9/16] max-h-80 overflow-hidden border bg-black">
 <video
 ref={coverVideoRef}
 src={preview}
 className="w-full h-full object-contain"
 controls
 onLoadedMetadata={() => seekCoverPreview(coverFramePct)}
 />
 {customCover && (
 <div className="absolute bottom-2 left-2 right-2 rounded border border-white/60 overflow-hidden max-h-20">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={customCover.file_url ?? customCover.url}
 alt="Cover preview"
 className="w-full h-full object-cover"
 />
 </div>
 )}
 <button type="button"
 onClick={() => { setFile(null); setPreview(null); setCustomCover(null); }}
 className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 )}

 <canvas ref={coverCanvasRef} className="hidden" aria-hidden />

 <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

 <Textarea
 placeholder="Write a caption…"
 value={caption}
 onChange={(e) => setCaption(e.target.value)}
 rows={3}
 maxLength={500}
 />
 <p className="text-xs text-muted-foreground text-right">{caption.length}/500</p>

 {preview && (
 <div className="space-y-2">
 <Label className="flex items-center gap-2">
 <ImageIcon className="h-4 w-4" /> Cover frame
 </Label>
 <p className="text-xs text-muted-foreground">Scrub the video, then capture a 9:16 frame as the thumbnail (optional).</p>
 <input
 type="range"
 min={0}
 max={100}
 value={coverFramePct}
 onChange={(e) => seekCoverPreview(Number(e.target.value))}
 className="w-full"
 />
 <Button type="button" variant="secondary" className="w-full" onClick={() => void captureCustomCover()}>
 Use current frame as cover
 </Button>
 </div>
 )}

 <div className="space-y-2">
 <Label>Who can see this</Label>
 <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="everyone">Everyone</SelectItem>
 <SelectItem value="followers">Followers</SelectItem>
 <SelectItem value="only_me">Only me</SelectItem>
 </SelectContent>
 </Select>
 </div>

 <label className="flex items-center gap-2 text-sm">
 <input
 type="checkbox"
 checked={allowComments}
 onChange={(e) => setAllowComments(e.target.checked)}
 />
 Allow comments
 </label>

 <label className="flex items-center gap-2 text-sm">
 <input
 type="checkbox"
 checked={allowRemix}
 onChange={(e) => setAllowRemix(e.target.checked)}
 />
 Allow others to use this reel as a remix source
 </label>

 <div className="space-y-2 rounded border border-foreground/30 p-3">
 <Label>Sound (optional)</Label>
 <p className="text-xs text-muted-foreground">Pick a track from the library, or search by title.</p>
 <div className="flex gap-2">
 <input
 type="text"
 value={audioSearch}
 onChange={(e) => setAudioSearch(e.target.value)}
 placeholder="Search sounds…"
 className="flex-1 rounded border bg-background px-2 py-1.5 text-sm"
 />
 <Button type="button" variant="secondary" size="sm" onClick={() => void runAudioSearch()}>
 Search
 </Button>
 </div>
 {(audioSearchHits.length > 0 ? audioSearchHits : trendingAudio).slice(0, 12).map((t) => (
 <label
 key={t.id}
 className="flex cursor-pointer items-center gap-2 rounded border border-foreground/20 px-2 py-1.5 text-sm hover:bg-secondary/50"
 >
 <input
 type="radio"
 name="reel-audio"
 checked={selectedAudioId === t.id}
 onChange={() => setSelectedAudioId(t.id)}
 />
 <span className="min-w-0 flex-1 truncate">
 {t.title}
 {t.artist_label ? <span className="text-muted-foreground"> — {t.artist_label}</span> : null}
 </span>
 </label>
 ))}
 {selectedAudioId != null ? (
 <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => setSelectedAudioId(undefined)}>
 Clear sound
 </Button>
 ) : null}
 </div>

 {uploading && (
 <div className="space-y-1">
 <Progress value={progress} className="h-2" />
 <p className="text-xs text-muted-foreground text-center">Uploading {progress}%…</p>
 </div>
 )}

 <Button onClick={handleSubmit} disabled={!file || uploading} className="w-full gap-2">
 <Film className="h-4 w-4" />
 {uploading ? "Publishing…" : "Publish Reel"}
 </Button>
 </CardContent>
 </Card>
 </div>
 );
}
