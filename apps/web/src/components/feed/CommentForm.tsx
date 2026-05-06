"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { postsApi } from "@jungle/api-client";
import type { Comment, Sticker } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import { useAdvancedMediaUpload } from "@/hooks/use-advanced-media-upload";
import {
 Avatar,
 AvatarFallback,
 AvatarImage,
 Button,
 Input,
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@jungle/ui";
import { Send, Image as ImageIcon, Mic, Smile, Square, X } from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import { GifPicker } from "@/components/shared/GifPicker";
import { StickerPicker } from "@/components/chat/StickerPicker";
import { MentionSuggestions, detectMention } from "@/components/shared/MentionSuggestions";
import { toast } from "sonner";

interface CommentFormProps {
 postId: number;
 replyTo?: number;
 onSuccess?: (comment: Comment) => void;
}

export function CommentForm({ postId, replyTo, onSuccess }: CommentFormProps) {
 const { user } = useAuthStore();
 const [content, setContent] = useState("");
 const [isLoading, setIsLoading] = useState(false);
 const [imagePreview, setImagePreview] = useState<string | null>(null);
 const [imageFile, setImageFile] = useState<File | null>(null);
 // CM1 — voice recording state.
 const [recording, setRecording] = useState(false);
 const [recordingTime, setRecordingTime] = useState(0);
 const [stickerOpen, setStickerOpen] = useState(false);
 const mediaRecorderRef = useRef<MediaRecorder | null>(null);
 const audioChunksRef = useRef<Blob[]>([]);
 const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const imageInputRef = useRef<HTMLInputElement>(null);
 const formRef = useRef<HTMLFormElement>(null);
 const { uploadProcessedMedia, isBusy: isUploading } = useAdvancedMediaUpload();

 const [mentionQuery, setMentionQuery] = useState("");
 const [mentionVisible, setMentionVisible] = useState(false);
 const [cursorPos, setCursorPos] = useState(0);

 const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setImageFile(file);
 setImagePreview(URL.createObjectURL(file));
 e.target.value = "";
 };

 const handleGifSelect = (gifUrl: string) => {
 setContent((prev) => (prev ? prev + "\n" : "") + gifUrl);
 inputRef.current?.focus();
 };

 // CM2 — Sticker picker: upload as image media and send immediately.
 const handleStickerSelect = async (sticker: Sticker) => {
 setStickerOpen(false);
 setIsLoading(true);
 try {
 // Fetch the sticker asset and re-upload so the comment ends up with a
 // stable media_id pointing to our storage.
 const resp = await fetch(sticker.url);
 const blob = await resp.blob();
 const file = new File([blob], `sticker-${sticker.id}.png`, {
 type: blob.type || "image/png",
 });
 const media = await uploadProcessedMedia(file, {
 imageOptions: { maxWidth: 512, maxSizeMB: 0.5 },
 });
 if (!media) throw new Error("Upload failed");
 const comment = await postsApi.createComment(postId, {
 content: "",
 reply_to: replyTo,
 media,
 });
 onSuccess?.(comment);
 } catch {
 toast.error("Failed to send sticker");
 } finally {
 setIsLoading(false);
 }
 };

 // CM1 — Voice recording (same pattern as PostComposer / ChatWindow).
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
 const file = new File([blob], `voice-comment-${Date.now()}.webm`, {
 type: "audio/webm",
 });
 setIsLoading(true);
 try {
 const media = await uploadProcessedMedia(file);
 if (!media) throw new Error("Upload failed");
 const comment = await postsApi.createComment(postId, {
 content: "",
 reply_to: replyTo,
 media,
 });
 onSuccess?.(comment);
 } catch {
 toast.error("Failed to send voice comment");
 } finally {
 setIsLoading(false);
 }
 };
 mediaRecorderRef.current = mediaRecorder;
 mediaRecorder.start();
 setRecording(true);
 setRecordingTime(0);
 recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
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

 const handleMentionSelect = (username: string) => {
 const before = content.slice(0, cursorPos);
 const after = content.slice(cursorPos);
 const mentionStart = before.lastIndexOf("@");
 if (mentionStart === -1) return;
 const newContent = before.slice(0, mentionStart) + `@${username} ` + after;
 setContent(newContent);
 setMentionVisible(false);
 setMentionQuery("");
 setTimeout(() => {
 inputRef.current?.focus();
 const newPos = mentionStart + username.length + 2;
 inputRef.current?.setSelectionRange(newPos, newPos);
 }, 0);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!content.trim() && !imageFile) return;
 setIsLoading(true);
 try {
 let media: Awaited<ReturnType<typeof uploadProcessedMedia>> | undefined;
 if (imageFile) {
 media = await uploadProcessedMedia(imageFile, { imageOptions: { maxWidth: 1024, maxSizeMB: 1 } }) ?? undefined;
 }
 const comment = await postsApi.createComment(postId, {
 content,
 reply_to: replyTo,
 media,
 });
 setContent("");
 setImageFile(null);
 if (imagePreview) URL.revokeObjectURL(imagePreview);
 setImagePreview(null);
 onSuccess?.(comment);
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to post comment");
 } finally {
 setIsLoading(false);
 }
 };

 if (!user) return null;

 return (
 <form onSubmit={handleSubmit}>
 {imagePreview && (
 <div className="relative ml-10 inline-block mb-2">
 <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border-subtle">
 <Image src={imagePreview} alt="" fill unoptimized className="object-cover" />
 </div>
 <button
 type="button"
 onClick={() => {
 if (imagePreview) URL.revokeObjectURL(imagePreview);
 setImagePreview(null);
 setImageFile(null);
 }}
 className="absolute -right-1 -top-1 rounded-full bg-card p-0.5 text-muted-foreground hover:text-foreground border border-border-subtle"
 >
 <X className="h-3 w-3" />
 </button>
 </div>
 )}

 <div className="flex items-center gap-2 pt-3">
 <Avatar className="h-8 w-8 shrink-0 rounded-full">
 <AvatarImage src={resolveAvatarUrl(user.avatar)} />
 <AvatarFallback>{user.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="flex flex-1 items-center gap-1 bg-surface-sunken rounded-full px-4 py-2 focus-within:ring-1 focus-within:ring-primary/50">
 <Input
 ref={inputRef}
 value={content}
 onChange={(e) => {
 setContent(e.target.value);
 const pos = e.target.selectionStart ?? 0;
 setCursorPos(pos);
 const { isMentioning, mentionQuery: q } = detectMention(e.target.value, pos);
 setMentionQuery(q);
 setMentionVisible(isMentioning);
 }}
 placeholder={replyTo ? "Write a reply…" : "Write a comment…"}
 className="h-7 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-transparent focus:translate-x-0 focus:translate-y-0"
 disabled={isLoading || isUploading}
 />
 <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
 <button
 type="button"
 onClick={() => imageInputRef.current?.click()}
 className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
 title="Add image"
 >
 <ImageIcon className="h-3.5 w-3.5" />
 </button>
 <GifPicker onGifSelect={handleGifSelect} triggerClassName="h-7 w-7 p-0" />
 <EmojiPicker
 onEmojiSelect={(emoji) => {
 setContent((prev) => prev + emoji);
 inputRef.current?.focus();
 }}
 triggerClassName="h-7 w-7 p-0"
 />
 <Popover open={stickerOpen} onOpenChange={setStickerOpen}>
 <PopoverTrigger asChild>
 <button
 type="button"
 className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground"
 title="Stickers"
 >
 <Smile className="h-3.5 w-3.5" />
 </button>
 </PopoverTrigger>
 <PopoverContent side="top" className="w-64 p-0">
 <StickerPicker onSelect={handleStickerSelect} />
 </PopoverContent>
 </Popover>
 <button
 type="button"
 className={`shrink-0 p-1 transition-colors ${
 recording ? "animate-pulse text-destructive" : "text-muted-foreground hover:text-foreground"
 }`}
 onClick={recording ? stopRecording : startRecording}
 title={recording ? "Stop recording" : "Voice comment"}
 disabled={isLoading || isUploading}
 >
 {recording ? <Square className="h-3 w-3" /> : <Mic className="h-3.5 w-3.5" />}
 </button>
 {recording && (
 <span className="font-mono text-[10px] text-destructive">
 {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:
 {(recordingTime % 60).toString().padStart(2, "0")}
 </span>
 )}
 </div>
 <Button
 type="submit"
 size="icon-sm"
 className="shrink-0"
 disabled={isLoading || isUploading || (!content.trim() && !imageFile)}
 >
 <Send className="h-3.5 w-3.5" />
 </Button>
 </div>

 <MentionSuggestions
 query={mentionQuery}
 visible={mentionVisible}
 onSelect={handleMentionSelect}
 />
 </form>
 );
}
