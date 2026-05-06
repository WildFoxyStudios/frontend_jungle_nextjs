"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuthStore } from "@jungle/hooks";
import Link from "next/link";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import { postsApi } from "@jungle/api-client";
import type { UrlPreview } from "@jungle/api-client";
import { resolveAvatarUrl } from "@/lib/avatar";
import type { Post, MediaItem } from "@jungle/api-client";
import {
 Avatar, AvatarFallback, AvatarImage, Button, Textarea,
 Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Progress,
 Popover, PopoverContent, PopoverTrigger,
 Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@jungle/ui";
import {
 Image as ImageIcon, Film, X, Smile, MapPin, Palette, BarChart3,
 Clock, Music, FileText, Volume2, Loader2, Sparkles, Mic, ShoppingBag,
 Square, HandCoins, Briefcase, Tag, Type, ShieldAlert,
} from "lucide-react";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GifPicker } from "@/components/shared/GifPicker";
import { MentionSuggestions, detectMention } from "@/components/shared/MentionSuggestions";
import { AiWriterDialog } from "@/components/shared/AiWriterDialog";
import { FundingCreationDialog } from "./post-types/FundingCreationDialog";
import { JobCreationDialog } from "./post-types/JobCreationDialog";
import { OfferCreationDialog } from "./post-types/OfferCreationDialog";

interface PostComposerProps {
 groupId?: number;
 pageId?: number;
 onSuccess?: (post: Post) => void;
}

type ComposerDraftPost = Pick<Post, "id">;

const PRIVACY_OPTIONS = [
 { value: "public", label: "public" },
 { value: "friends", label: "friends" },
 { value: "people_i_follow", label: "peopleIFollow" },
 { value: "people_follow_me", label: "peopleFollowMe" },
 { value: "anonymous", label: "anonymous" },
 { value: "only_me", label: "onlyMe" },
] as const;

let _mediaKeyCounter = 0;

export function PostComposer({ groupId, pageId, onSuccess }: PostComposerProps) {
 const { user } = useAuthStore();
 const t = useTranslations("feed");
 const tp = useTranslations("post");
 const tc = useTranslations("common");
 const {
 uploadProcessedMedia, isProcessing, isUploading, isBusy,
 processingProgress, uploadProgress, compressionInfo,
 } = useAdvancedMediaUpload();
 const [content, setContent] = useState("");
 const [privacy, setPrivacy] = useState<Post["privacy"]>("public");
 const [isLoading, setIsLoading] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const [pendingMedia, setPendingMedia] = useState<(MediaItem & { _key: number })[]>([]);
 const [feeling, setFeeling] = useState("");
 const [location, setLocation] = useState("");
 const [showLocationInput, setShowLocationInput] = useState(false);
 const [coloredBg, setColoredBg] = useState("");
 const [coloredText, setColoredText] = useState("");
 const [showPollCreator, setShowPollCreator] = useState(false);
 const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
 const [scheduledAt, setScheduledAt] = useState("");
 const [showScheduler, setShowScheduler] = useState(false);
 const [showAiWriter, setShowAiWriter] = useState(false);
 const [showFunding, setShowFunding] = useState(false);
 const [showJob, setShowJob] = useState(false);
 const [showOffer, setShowOffer] = useState(false);
 const [recording, setRecording] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);
 // P1/P2/P5 — plan §3.2
 const [dragging, setDragging] = useState(false);
 const [urlPreview, setUrlPreview] = useState<UrlPreview | null>(null);
 const [loadingPreview, setLoadingPreview] = useState(false);
 const [richMode, setRichMode] = useState(false);
 const urlPreviewedRef = useRef<Set<string>>(new Set());
 const urlPreviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);
 const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
 const imageInputRef = useRef<HTMLInputElement>(null);
 const videoInputRef = useRef<HTMLInputElement>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const audioInputRef = useRef<HTMLInputElement>(null);
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 const addLocalMedia = useCallback((file: File, type: "image" | "video" | "audio" | "file") => {
 const key = ++_mediaKeyCounter;
 const localUrl = URL.createObjectURL(file);
 const localItem: MediaItem & { _key: number; _uploading?: boolean; _localUrl?: string } = {
 id: Date.now() + key,
 url: localUrl,
 type,
 name: file.name,
 _key: key,
 _uploading: true,
 _localUrl: localUrl,
 };
 setPendingMedia((prev) => [...prev, localItem]);
 return key;
 }, []);

 const updateMedia = useCallback((key: number, updates: Partial<MediaItem> & { _uploading?: boolean }) => {
 setPendingMedia((prev) =>
 prev.map((m) => (m._key === key ? { ...m, ...updates } : m)),
 );
 }, []);

 const removeMediaByKey = useCallback((key: number) => {
 setPendingMedia((prev) => {
 const item = prev.find((m) => m._key === key);
 if (item) {
 const raw = item as unknown as Record<string, unknown>;
 if (raw._localUrl) URL.revokeObjectURL(raw._localUrl as string);
 }
 return prev.filter((m) => m._key !== key);
 });
 }, []);

 const detectFileKind = (file: File): "image" | "video" | "audio" | "file" => {
 if (file.type.startsWith("image/")) return "image";
 if (file.type.startsWith("video/")) return "video";
 if (file.type.startsWith("audio/")) return "audio";
 return "file";
 };

 const uploadFile = useCallback(async (
 file: File,
 type: "image" | "video" | "audio" | "file",
 key: number,
 opts?: Parameters<typeof uploadProcessedMedia>[1],
 ) => {
 try {
 const result = await uploadProcessedMedia(file, opts);
 if (result) {
 updateMedia(key, {
 id: result.id,
 url: result.url,
 type: type === "file" ? "file" as const : result.type,
 thumbnail: result.thumbnail,
 name: type === "file" ? file.name : result.name,
 _uploading: false,
 });
 } else {
 toast.error(`${t("failedUpload")} ${file.name}`);
 removeMediaByKey(key);
 }
 } catch (err) {
 toast.error(err instanceof Error ? err.message : `${t("failedUpload")} ${file.name}`);
 removeMediaByKey(key);
 }
 }, [uploadProcessedMedia, updateMedia, removeMediaByKey, t]);

 const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = Array.from(e.target.files ?? []);
 e.target.value = "";
 if (files.length === 0) return;
 for (const file of files) {
 const key = addLocalMedia(file, "image");
 uploadFile(file, "image", key, { imageOptions: { maxWidth: 2048, maxSizeMB: 2 } });
 }
 };

 const handleVideoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 const key = addLocalMedia(file, "video");
 uploadFile(file, "video", key, { videoOptions: { maxDurationSec: 120, maxSizeMB: 50 } });
 };

 const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 const key = addLocalMedia(file, "file");
 uploadFile(file, "file", key);
 };

 const handleAudioPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 e.target.value = "";
 if (!file) return;
 const key = addLocalMedia(file, "audio");
 uploadFile(file, "audio", key);
 };

 const startRecording = async () => {
 try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
 const mediaRecorder = new MediaRecorder(stream);
 audioChunksRef.current = [];
 mediaRecorder.ondataavailable = (e) => {
 if (e.data.size > 0) audioChunksRef.current.push(e.data);
 };
 mediaRecorder.onstop = async () => {
 stream.getTracks().forEach((t) => t.stop());
 const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
 const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
 setIsLoading(true);
 try {
 const formData = new FormData();
 formData.append("audio", file);
 formData.append("text", content);
 await postsApi.createAudioPost(formData);
 toast.success(tp("published"));
 resetForm();
 onSuccess?.({ id: Date.now() } as ComposerDraftPost as Post); // Optimistic success
 } catch { toast.error(tp("failed")); }
 setIsLoading(false);
 };
 mediaRecorderRef.current = mediaRecorder;
 mediaRecorder.start();
 setRecording(true);
 setRecordingTime(0);
 recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
 setIsExpanded(true);
 } catch {
 toast.error("Microphone access denied");
 }
 };

 const stopRecording = () => {
 mediaRecorderRef.current?.stop();
 setRecording(false);
 if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
 setRecordingTime(0);
 };

 const handleGifSelect = (gifUrl: string) => {
 setContent((prev) => (prev ? prev + "\n" : "") + gifUrl);
 };

 // P1 — Drag & drop files onto the composer card.
 const handleDragOver = (e: React.DragEvent) => {
 if (!e.dataTransfer?.types?.includes("Files")) return;
 e.preventDefault();
 if (!dragging) setDragging(true);
 };
 const handleDragLeave = (e: React.DragEvent) => {
 // Ignore bubbling leave events from children.
 if (e.currentTarget === e.target) setDragging(false);
 };
 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 setDragging(false);
 const files = Array.from(e.dataTransfer.files ?? []);
 if (files.length === 0) return;
 setIsExpanded(true);
 for (const file of files) {
 const kind = detectFileKind(file);
 const key = addLocalMedia(file, kind);
 const opts: Parameters<typeof uploadProcessedMedia>[1] =
 kind === "image"
 ? { imageOptions: { maxWidth: 2048, maxSizeMB: 2 } }
 : kind === "video"
 ? { videoOptions: { maxDurationSec: 120, maxSizeMB: 50 } }
 : undefined;
 uploadFile(file, kind, key, opts);
 }
 };

 // P2 — Detect first URL in content, debounce fetch, show preview.
 useEffect(() => {
 const urlRegex = /(https?:\/\/[^\s<>"']+)/i;
 const match = content.match(urlRegex);
 const firstUrl = match?.[0];

 if (urlPreviewTimerRef.current) clearTimeout(urlPreviewTimerRef.current);

 if (!firstUrl) {
 if (urlPreview) setUrlPreview(null);
 return;
 }
 // Same URL as the current preview -> nothing to do.
 if (urlPreview?.url === firstUrl) return;
 // Already fetched once and failed, don't retry automatically.
 if (urlPreviewedRef.current.has(firstUrl) && !urlPreview) return;

 urlPreviewTimerRef.current = setTimeout(async () => {
 setLoadingPreview(true);
 try {
 const preview = await postsApi.previewUrl(firstUrl);
 urlPreviewedRef.current.add(firstUrl);
 // Only accept previews with at least a title or image.
 if (preview.title || preview.image_url) {
 setUrlPreview(preview);
 }
 } catch {
 urlPreviewedRef.current.add(firstUrl);
 } finally {
 setLoadingPreview(false);
 }
 }, 800);

 return () => {
 if (urlPreviewTimerRef.current) clearTimeout(urlPreviewTimerRef.current);
 };
 }, [content, urlPreview]);

 // P3 — Consume an AI-generated image URL as a media item.
 const handleInsertAiImage = async (url: string) => {
 try {
 // Download the image into a File so the normal upload pipeline can
 // re-host it on our storage and share a stable URL.
 const resp = await fetch(url);
 const blob = await resp.blob();
 const file = new File([blob], `ai-image-${Date.now()}.png`, {
 type: blob.type || "image/png",
 });
 const key = addLocalMedia(file, "image");
 uploadFile(file, "image", key, { imageOptions: { maxWidth: 2048, maxSizeMB: 2 } });
 setIsExpanded(true);
 } catch {
 toast.error("Failed to attach AI image");
 }
 };

 const removeMedia = (key: number) => removeMediaByKey(key);

 const resetForm = () => {
 setContent("");
 setIsExpanded(false);
 setPendingMedia([]);
 setFeeling("");
 setLocation("");
 setColoredBg("");
 setColoredText("");
 setShowPollCreator(false);
 setPollOptions(["", ""]);
 setShowLocationInput(false);
 setScheduledAt("");
 setShowScheduler(false);
 setUrlPreview(null);
 setRichMode(false);
 urlPreviewedRef.current.clear();
 };

 const hasUploadingMedia = pendingMedia.some((m) => (m as unknown as Record<string, unknown>)._uploading);

 const handleSubmit = async () => {
 if (!content.trim() && pendingMedia.length === 0) return;
 if (hasUploadingMedia) {
 toast.warning(t("waitUpload"));
 return;
 }
 setIsLoading(true);
 try {
 const validPollOptions = pollOptions.filter((o) => o.trim());
 const uploadedMedia = pendingMedia
 .filter((m) => !(m as unknown as Record<string, unknown>)._uploading)
 .filter((m) => !m.url.startsWith("blob:"))
 .map((m) => ({ id: m.id, url: m.url, type: m.type, thumbnail: m.thumbnail }));
 const post = await postsApi.createPost({
 content,
 privacy,
 group_id: groupId,
 page_id: pageId,
 feeling: feeling || undefined,
 location: location || undefined,
 colored_background: coloredBg || undefined,
 colored_text_color: coloredText || undefined,
 poll_options: validPollOptions.length >= 2 ? validPollOptions : undefined,
 scheduled_at: scheduledAt || undefined,
 media: uploadedMedia.length > 0 ? uploadedMedia : undefined,
 link_preview: urlPreview ?? undefined,
 });
 // Augment post with link fields from the urlPreview so link embeds
 // render immediately — the server may not return link_url/link_title/etc.
 if (urlPreview && !post.link_url) {
 post.link_url = urlPreview.url ?? undefined;
 post.link_title = urlPreview.title ?? undefined;
 post.link_description = urlPreview.description ?? undefined;
 post.link_image = urlPreview.image_url ?? undefined;
 }
 // Revoke all local blob URLs before clearing
 for (const m of pendingMedia) {
 const raw = m as unknown as Record<string, unknown>;
 if (raw._localUrl) URL.revokeObjectURL(raw._localUrl as string);
 }
 resetForm();
 onSuccess?.(post);
 toast.success(scheduledAt ? tp("scheduled") : tp("published"));
 } catch (err) {
 toast.error(err instanceof Error ? err.message : tp("failed"));
 } finally {
 setIsLoading(false);
 }
 };

 if (!user) return null;

 return (
 <>
 {/* Collapsed composer — Facebook-style */}
 <div
 className="bg-card rounded-lg overflow-hidden"
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 >
 {dragging && (
 <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-lg">
 <p className="bg-card/95 px-4 py-2 text-sm font-medium text-foreground shadow-md rounded-lg">
 Drop files to attach
 </p>
 </div>
 )}
 {/* Top row: avatar + "What's on your mind?" pill */}
 <div className="flex items-center gap-3 p-3 pb-2">
 <Avatar className="h-10 w-10 shrink-0 rounded-full">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <button
 type="button"
 onClick={() => setIsExpanded(true)}
 className="flex-1 h-10 rounded-full bg-muted px-4 text-left text-[15px] text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
 >
 {t("whatsOnYourMind")}, {user.first_name}?
 </button>
 </div>
 {/* Divider */}
 <div className="mx-3 border-t border-border" />
 {/* Bottom row: Facebook-style action buttons */}
 <div className="flex items-center justify-between px-3 py-1.5">
 <Button
 variant="ghost"
 size="sm"
 className="flex-1 h-9 gap-2 rounded-md text-[15px] font-medium text-muted-foreground hover:bg-muted"
 onClick={() => { setIsExpanded(true); }}
 >
 <Film className="h-5 w-5 text-red-500" />
 {t("liveVideo")}
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="flex-1 h-9 gap-2 rounded-md text-[15px] font-medium text-muted-foreground hover:bg-muted"
 onClick={() => { setIsExpanded(true); setTimeout(() => imageInputRef.current?.click(), 100); }}
 >
 <ImageIcon className="h-5 w-5 text-emerald-500" />
 {t("photoVideo")}
 </Button>
 <Button
 variant="ghost"
 size="sm"
 className="flex-1 h-9 gap-2 rounded-md text-[15px] font-medium text-muted-foreground hover:bg-muted"
 onClick={() => { setIsExpanded(true); }}
 >
 <Smile className="h-5 w-5 text-amber-500" />
 {t("feelingActivity")}
 </Button>
 </div>
 </div>

 {/* Expanded editor dialog */}
 <Dialog open={isExpanded} onOpenChange={(open) => { if (!open) resetForm(); }}>
 <DialogContent
 className="max-h-[90dvh] w-[min(calc(100vw-1rem),42rem)] overflow-y-auto p-0 gap-0"
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 >
 {dragging && (
 <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/20 backdrop-blur-sm rounded-lg">
 <p className="bg-card/95 px-4 py-2 text-sm font-medium text-foreground shadow-md rounded-lg">
 Drop files to attach
 </p>
 </div>
 )}
 <DialogHeader className="shrink-0 border-b px-4 py-3 text-left">
 <DialogTitle className="font-semibold text-base">
 {t("createPost")}
 </DialogTitle>
 </DialogHeader>

 <div className="flex-1 space-y-3 p-4">
 <div className="flex items-center gap-3">
 <Avatar className="h-10 w-10 shrink-0 rounded-full">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div>
 <p className="text-sm font-semibold">
 {user.first_name} {user.last_name}
 </p>
 <div className="flex items-center gap-2 mt-0.5">
 <Select value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
 <SelectTrigger className="h-7 px-2 text-xs border-0 bg-muted rounded-md w-auto gap-1">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 {PRIVACY_OPTIONS.map((option) => (
 <SelectItem key={option.value} value={option.value}>
 {option.label === "public"
 ? tc("public")
 : option.label === "friends"
 ? tc("friends")
 : option.label === "onlyMe"
 ? tc("onlyMe")
 : tp(option.label)}
 </SelectItem>
 ))}
 </SelectContent>
 </Select>
 {groupId && <span className="text-xs text-muted-foreground">· Posting in group</span>}
 {pageId && <span className="text-xs text-muted-foreground">· Posting as page</span>}
 </div>
 </div>
 </div>

 <div className="relative">
 {richMode ? (
 <div className="min-h-[180px] border bg-input p-2 rounded-md">
 <RichTextEditor
 content={content}
 placeholder={t("whatsOnYourMind")}
 onChange={(html) => setContent(html)}
 onModEnter={() => void handleSubmit()}
 />
 </div>
 ) : (
 <Textarea
 ref={textareaRef}
 placeholder={t("whatsOnYourMind")}
 value={content}
 onChange={(e) => setContent(e.target.value)}
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
 e.preventDefault();
 void handleSubmit();
 }
 }}
 rows={5}
 className="resize-none min-h-[132px] px-4 py-3 text-sm"
 style={coloredBg ? {
 background: coloredBg,
 color: coloredText || "#fff",
 textAlign: "center",
 fontWeight: "bold",
 fontSize: "1.1rem",
 minHeight: "120px",
 } : undefined}
 />
 )}
 {(() => {
 const { mentionQuery, isMentioning } = detectMention(
 content,
 textareaRef.current?.selectionStart ?? content.length,
 );
 return (
 <MentionSuggestions
 query={mentionQuery}
 visible={isMentioning}
 onSelect={(username) => {
 const pos = textareaRef.current?.selectionStart ?? content.length;
 const before = content.slice(0, pos).replace(/@\w*$/, `@${username} `);
 const after = content.slice(pos);
 setContent(before + after);
 textareaRef.current?.focus();
 }}
 />
 );
 })()}
 </div>

 {/* P4 — Anonymous badge */}
 {privacy === "anonymous" && (
 <div className="flex items-center gap-1.5 bg-warning/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 rounded-md">
 <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
 Your name and avatar will be hidden when this post is published.
 </div>
 )}

 {/* P2 — URL preview */}
 {loadingPreview && !urlPreview && (
 <div className="flex items-center gap-2 bg-muted px-3 py-2 text-xs text-muted-foreground rounded-md">
 <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching link preview…
 </div>
 )}
 {urlPreview && (
 <div className="group relative overflow-hidden bg-muted/50 rounded-lg">
 <button
 type="button"
 onClick={() => { setUrlPreview(null); urlPreviewedRef.current.add(urlPreview.url); }}
 className="absolute right-1.5 top-1.5 z-10 bg-card p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100 rounded-md"
 >
 <X className="h-3 w-3" />
 </button>
 {urlPreview.image_url && (
 <div className="relative aspect-[1.91/1] bg-muted">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={urlPreview.image_url}
 alt={urlPreview.title ?? ""}
 className="absolute inset-0 h-full w-full object-cover"
 />
 </div>
 )}
 <div className="space-y-0.5 p-2.5">
 {urlPreview.site_name && (
 <p className="text-[10px] text-muted-foreground">{urlPreview.site_name}</p>
 )}
 {urlPreview.title && (
 <p className="text-sm font-semibold line-clamp-2">{urlPreview.title}</p>
 )}
 {urlPreview.description && (
 <p className="text-xs text-muted-foreground line-clamp-2">{urlPreview.description}</p>
 )}
 </div>
 </div>
 )}

 {/* Feeling badge */}
 {feeling && (
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <span>{tp("feeling", { feeling })}</span>
 <button type="button" onClick={() => setFeeling("")} className="hover:text-foreground"><X className="h-3 w-3" /></button>
 </div>
 )}

 {/* Location badge */}
 {location && !showLocationInput && (
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <MapPin className="h-3 w-3" />
 <span>{location}</span>
 <button type="button" onClick={() => { setLocation(""); }} className="hover:text-foreground"><X className="h-3 w-3" /></button>
 </div>
 )}

 {/* Location input */}
 {showLocationInput && (
 <div className="flex items-center gap-2">
 <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
 <input
 className="h-9 flex-1 bg-muted px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
 placeholder={tp("addLocation")}
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 onKeyDown={(e) => { if (e.key === "Enter") setShowLocationInput(false); }}
 />
 <button type="button" onClick={() => { setShowLocationInput(false); setLocation(""); }} className="text-muted-foreground hover:text-foreground">
 <X className="h-3 w-3" />
 </button>
 </div>
 )}

 {/* Poll creator */}
 {showPollCreator && (
 <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold">{tp("pollOptions")}</p>
 <button type="button" onClick={() => { setShowPollCreator(false); setPollOptions(["", ""]); }} className="text-muted-foreground hover:text-foreground">
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 {pollOptions.map((opt, idx) => (
 <div key={idx} className="flex gap-2">
 <input
 className="h-9 flex-1 bg-muted px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
 placeholder={tp("optionN", { n: idx + 1 })}
 value={opt}
 onChange={(e) => { const next = [...pollOptions]; next[idx] = e.target.value; setPollOptions(next); }}
 />
 {pollOptions.length > 2 && (
 <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-foreground">
 <X className="h-3 w-3" />
 </button>
 )}
 </div>
 ))}
 {pollOptions.length < 6 && (
 <Button variant="ghost" size="sm" type="button" onClick={() => setPollOptions([...pollOptions, ""])}>
 + {tp("addOption")}
 </Button>
 )}
 </div>
 )}

 {/* Pending media previews */}
 {pendingMedia.length > 0 && (
 <div className="grid grid-cols-3 gap-2">
 {pendingMedia.map((m) => {
 const uploading = !!(m as unknown as Record<string, unknown>)._uploading;
 return (
 <div key={m._key} className="group relative aspect-square overflow-hidden bg-muted rounded-md">
 {m.type === "image" && m.url ? (
 <Image src={m.url} alt="" fill unoptimized className="object-cover" />
 ) : m.type === "video" && m.url ? (
 <video src={m.url} className="h-full w-full object-cover" muted />
 ) : m.type === "audio" ? (
 <div className="flex h-full w-full flex-col items-center justify-center gap-1">
 <Volume2 className="h-6 w-6 text-muted-foreground" />
 <span className="truncate px-1 text-[10px] text-muted-foreground">{m.name ?? tc("audio")}</span>
 </div>
 ) : (
 <div className="flex h-full w-full flex-col items-center justify-center gap-1">
 <FileText className="h-6 w-6 text-muted-foreground" />
 <span className="truncate px-1 text-[10px] text-muted-foreground">{m.name ?? tc("file")}</span>
 </div>
 )}
 {uploading && (
 <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
 <Loader2 className="h-5 w-5 animate-spin text-background" />
 </div>
 )}
 <button
 type="button"
 onClick={() => removeMedia(m._key)}
 className="absolute right-1 top-1 bg-card p-1 text-foreground opacity-0 transition-opacity group-hover:opacity-100 rounded-md"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 );
 })}
 </div>
 )}

 {/* Scheduler */}
 {showScheduler && (
 <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
 <div className="flex items-center justify-between">
 <p className="text-xs font-semibold">{tp("schedulePost")}</p>
 <button type="button" onClick={() => { setShowScheduler(false); setScheduledAt(""); }} className="text-muted-foreground hover:text-foreground">
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 <input
 type="datetime-local"
 className="h-9 w-full bg-muted px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
 value={scheduledAt}
 onChange={(e) => setScheduledAt(e.target.value)}
 min={new Date().toISOString().slice(0, 16)}
 />
 {scheduledAt && (
 <p className="text-xs text-muted-foreground">
 {tp("willPublishAt", { date: new Date(scheduledAt).toLocaleString() })}
 </p>
 )}
 </div>
 )}

 {/* Processing / Upload progress */}
 {isBusy && (
 <div className="space-y-1">
 {isProcessing && (
 <div>
 <p className="text-xs text-muted-foreground">{tp("optimizing")} {processingProgress}%</p>
 <Progress value={processingProgress} className="h-1" />
 </div>
 )}
 {isUploading && (
 <div>
 <p className="text-xs text-muted-foreground">
 {tp("uploading")} {uploadProgress}%
 {compressionInfo && compressionInfo.savedPercent > 0 && (
 <span className="text-green-600 ml-1">
 ({tc("savedPercent", { n: compressionInfo.savedPercent })})
 </span>
 )}
 </p>
 <Progress value={uploadProgress} className="h-1" />
 </div>
 )}
 </div>
 )}

 {/* Quick action buttons row */}
 <div className="flex flex-wrap items-center gap-1 border bg-muted/30 p-1 rounded-lg">
 <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
 <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
 <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt" className="hidden" onChange={handleFilePick} />
 <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioPick} />
 <Button variant="ghost" size="sm" title={t("photo")} type="button" onClick={() => imageInputRef.current?.click()} disabled={isBusy}>
 <ImageIcon className="h-4 w-4 text-emerald-500" />
 </Button>
 <Button variant="ghost" size="sm" title={t("video")} type="button" onClick={() => videoInputRef.current?.click()} disabled={isBusy}>
 <Film className="h-4 w-4 text-red-500" />
 </Button>
 <Button variant="ghost" size="sm" title={tp("audio")} type="button" onClick={() => audioInputRef.current?.click()} disabled={isBusy}>
 <Music className="h-4 w-4" />
 </Button>
 <EmojiPicker onEmojiSelect={(emoji) => { setContent((prev) => prev + emoji); textareaRef.current?.focus(); }} />
 <GifPicker onGifSelect={handleGifSelect} />
 <FeelingPicker value={feeling} onChange={setFeeling} />
 <Button variant="ghost" size="sm" title={tp("locationLink")} type="button" onClick={() => setShowLocationInput(!showLocationInput)}>
 <MapPin className="h-4 w-4" />
 </Button>
 <ColorPicker active={!!coloredBg} onSelect={(bg, text) => { setColoredBg(bg); setColoredText(text); }} onClear={() => { setColoredBg(""); setColoredText(""); }} />
 <Button variant="ghost" size="sm" title={tp("poll")} type="button" onClick={() => setShowPollCreator(!showPollCreator)}>
 <BarChart3 className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" title={tp("attachFile")} type="button" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
 <FileText className="h-4 w-4" />
 </Button>
 <Button
 variant={recording ? "destructive" : "ghost"} size="sm" title={tp("voiceNote")} type="button"
 className={recording ? "animate-pulse" : "text-red-500"}
 onClick={recording ? stopRecording : startRecording} disabled={isBusy}
 >
 {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
 {recording && <span className="ml-1 font-mono text-xs">{Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>}
 </Button>
 <Button variant="ghost" size="sm" title={tp("sellProduct")} asChild>
 <Link href="/marketplace/create"><ShoppingBag className="h-4 w-4 text-orange-500" /></Link>
 </Button>
 <Button variant="ghost" size="sm" title={tp("schedule")} type="button" onClick={() => setShowScheduler(!showScheduler)}>
 <Clock className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" title={tp("funding")} type="button" onClick={() => setShowFunding(true)} className="text-emerald-600">
 <HandCoins className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" title={tp("jobs")} type="button" onClick={() => setShowJob(true)} className="text-blue-600">
 <Briefcase className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" title={tp("offers")} type="button" onClick={() => setShowOffer(true)} className="text-purple-600">
 <Tag className="h-4 w-4" />
 </Button>
 <div className="flex-1" />
 <Button variant="ghost" size="sm" type="button" onClick={() => { setRichMode((v) => {
 if (v && content.includes("<")) { const plain = content.replace(/<[^>]+>/g, "").trim(); setContent(plain); }
 return !v;
 }); }}>
 <Type className="h-4 w-4" />
 </Button>
 <Button variant="ghost" size="sm" type="button" onClick={() => setShowAiWriter(true)} className="text-primary">
 <Sparkles className="h-4 w-4" />
 </Button>
 </div>

 <div className="flex items-center justify-between pt-2">
 <Button variant="ghost" size="sm" type="button" onClick={resetForm}>
 {tc("cancel")}
 </Button>
 <Button
 size="sm"
 type="button"
 className="px-5"
 onClick={handleSubmit}
 disabled={isLoading || hasUploadingMedia || loadingPreview || (!content.trim() && pendingMedia.length === 0)}
 >
 {isLoading ? tc("loading") : hasUploadingMedia ? tc("uploading") : tc("submit")}
 </Button>
 </div>
 </div>
 </DialogContent>
 </Dialog>

 <AiWriterDialog
 open={showAiWriter}
 onClose={() => setShowAiWriter(false)}
 onInsertText={(text) => { setContent((prev) => prev ? prev + "\n" + text : text); setIsExpanded(true); }}
 onInsertImage={handleInsertAiImage}
 />
 <FundingCreationDialog open={showFunding} onOpenChange={setShowFunding} onSuccess={() => { resetForm(); onSuccess?.({ id: Date.now() } as ComposerDraftPost as Post); }} />
 <JobCreationDialog open={showJob} onOpenChange={setShowJob} onSuccess={() => { resetForm(); onSuccess?.({ id: Date.now() } as ComposerDraftPost as Post); }} />
 <OfferCreationDialog open={showOffer} onOpenChange={setShowOffer} onSuccess={() => { resetForm(); onSuccess?.({ id: Date.now() } as ComposerDraftPost as Post); }} />
 </>
 );
}

const FEELINGS = [
 { emoji: "😊", label: "happy" },
 { emoji: "😍", label: "loved" },
 { emoji: "😎", label: "cool" },
 { emoji: "😢", label: "sad" },
 { emoji: "😡", label: "angry" },
 { emoji: "😴", label: "sleepy" },
 { emoji: "🤔", label: "thinking" },
 { emoji: "😂", label: "funny" },
 { emoji: "🥳", label: "celebrating" },
 { emoji: "😤", label: "frustrated" },
 { emoji: "🤒", label: "sick" },
 { emoji: "😇", label: "blessed" },
 { emoji: "🥰", label: "grateful" },
 { emoji: "😏", label: "mischievous" },
 { emoji: "🤩", label: "excited" },
 { emoji: "😋", label: "hungry" },
];

function FeelingPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
 const [open, setOpen] = useState(false);
 const t = useTranslations("post");

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="sm" title={t("feelingLink")} type="button">
 <Smile className="h-4 w-4" />
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-64 p-2" side="top" align="start">
 <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">{t("feelingQuestion")}</p>
 <div className="grid grid-cols-4 gap-1.5">
 {FEELINGS.map((f) => (
 <button
 key={f.label}
 type="button"
 onClick={() => { onChange(`${f.emoji} ${t("feelings." + f.label)}`); setOpen(false); }}
 className={`flex flex-col items-center gap-0.5 border p-1.5 text-xs transition-colors hover:bg-muted/50 rounded-md ${
 value.includes(f.label)
 ? "border-primary bg-primary text-primary-foreground"
 : "border-transparent"
 }`}
 >
 <span className="text-lg leading-none">{f.emoji}</span>
 <span className="w-full truncate text-center text-[10px] font-medium">
 {t("feelings." + f.label)}
 </span>
 </button>
 ))}
 </div>
 </PopoverContent>
 </Popover>
 );
}

const COLOR_PRESETS = [
 { bg: "#1a73e8", text: "#ffffff" },
 { bg: "#e91e63", text: "#ffffff" },
 { bg: "#9c27b0", text: "#ffffff" },
 { bg: "#4caf50", text: "#ffffff" },
 { bg: "#ff9800", text: "#ffffff" },
 { bg: "#f44336", text: "#ffffff" },
 { bg: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", text: "#ffffff" },
 { bg: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", text: "#ffffff" },
 { bg: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", text: "#ffffff" },
 { bg: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)", text: "#333333" },
];

function ColorPicker({
 active,
 onSelect,
 onClear,
}: {
 active: boolean;
 onSelect: (bg: string, text: string) => void;
 onClear: () => void;
}) {
 const [open, setOpen] = useState(false);
 const t = useTranslations("post");

 return (
 <Popover open={open} onOpenChange={setOpen}>
 <PopoverTrigger asChild>
 <Button variant="ghost" size="sm" title={t("coloredPost")} type="button" className={active ? "text-primary" : ""}>
 <Palette className="h-4 w-4" />
 </Button>
 </PopoverTrigger>
 <PopoverContent className="w-52 p-2" side="top" align="start">
 <p className="mb-2 px-1 text-xs font-semibold text-muted-foreground">{t("bgColor")}</p>
 <div className="grid grid-cols-5 gap-1.5">
 {COLOR_PRESETS.map((c, i) => (
 <button
 key={i}
 type="button"
 className="h-8 w-8 rounded border transition-colors hover:bg-muted/50"
 style={{ background: c.bg }}
 onClick={() => { onSelect(c.bg, c.text); setOpen(false); }}
 />
 ))}
 </div>
 {active && (
 <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => { onClear(); setOpen(false); }}>
 {t("removeColor")}
 </Button>
 )}
 </PopoverContent>
 </Popover>
 );
}
