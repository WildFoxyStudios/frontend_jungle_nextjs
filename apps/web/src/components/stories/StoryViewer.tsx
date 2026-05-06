"use client";

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Story, StoryViewerUser } from "@jungle/api-client";
import { messagesApi, storiesApi } from "@jungle/api-client";
import { Avatar, AvatarImage, AvatarFallback, Button, Input } from "@jungle/ui";
import { useAuthStore } from "@jungle/hooks";
import {
 ChevronLeft,
 ChevronRight,
 Eye,
 MessageCircle,
 Pause,
 Play,
 Send,
 Trash2,
 Volume2,
 VolumeX,
 X,
} from "lucide-react";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { toast } from "sonner";

interface StoryViewerProps {
 stories: Story[];
 initialIndex?: number;
 onClose: () => void;
}

const REACTIONS = ["❤️", "😮", "😂", "😢", "🔥", "👏"];

export function StoryViewer({ stories, initialIndex = 0, onClose }: StoryViewerProps) {
 const [visibleStories, setVisibleStories] = useState(stories);
 const [currentIndex, setCurrentIndex] = useState(initialIndex);
 const [progress, setProgress] = useState(0);
 const [paused, setPaused] = useState(false);
 const [muted, setMuted] = useState(true);
 const [reply, setReply] = useState("");
 const [sendingReply, setSendingReply] = useState(false);
 const [reacted, setReacted] = useState<string | null>(null);
 const [viewers, setViewers] = useState<StoryViewerUser[]>([]);
 const [loadingViewers, setLoadingViewers] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const [openingChat, setOpeningChat] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);
 const { user } = useAuthStore();
 const router = useRouter();

 useEffect(() => {
 setVisibleStories(stories);
 setCurrentIndex(initialIndex);
 }, [stories, initialIndex]);

 const current = visibleStories[currentIndex];
 const durationMs = (current?.duration ?? 5) * 1000;
 const isOwnStory = Boolean(user && current && current.user_id === user.id);

 const goNext = useCallback(() => {
 if (currentIndex < visibleStories.length - 1) {
 setCurrentIndex((i) => i + 1);
 setProgress(0);
 } else {
 onClose();
 }
 }, [currentIndex, visibleStories.length, onClose]);

 const goPrev = useCallback(() => {
 if (currentIndex > 0) {
 setCurrentIndex((i) => i - 1);
 setProgress(0);
 }
 }, [currentIndex]);

 useEffect(() => {
 if (!current) return;
 storiesApi.viewStory(current.story_media_id).catch(() => { /* non-critical: failure is silent */ });
 }, [currentIndex, current]);

 useEffect(() => {
 if (!current || !isOwnStory) {
 setViewers([]);
 return;
 }

 setLoadingViewers(true);
 storiesApi.getStoryViewers(current.story_media_id)
 .then((result) => setViewers(result))
 .catch(() => setViewers([]))
 .finally(() => setLoadingViewers(false));
 }, [current, isOwnStory]);

 useEffect(() => {
 if (!current || paused) return;
 const interval = setInterval(() => {
 setProgress((p) => {
 if (p >= 100) {
 clearInterval(interval);
 goNext();
 return 0;
 }
 return p + (100 / (durationMs / 100));
 });
 }, 100);
 return () => clearInterval(interval);
 }, [currentIndex, current, durationMs, goNext, paused]);

 useEffect(() => {
 const handler = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 if (e.key === "ArrowLeft") goPrev();
 if (e.key === "ArrowRight") goNext();
 if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); }
 };
 document.addEventListener("keydown", handler);
 return () => document.removeEventListener("keydown", handler);
 }, [goNext, goPrev, onClose]);

 useEffect(() => {
 document.body.style.overflow = "hidden";
 return () => { document.body.style.overflow = ""; };
 }, []);

 if (!current) return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"><p className="text-white/70">No stories available</p></div>;

 const isVideo = current.media.type === "video";
 const publisher = current.publisher.username
 ? current.publisher
 : {
 ...current.publisher,
 id: user?.id ?? current.publisher.id,
 username: user?.username ?? current.publisher.username,
 first_name: user?.first_name ?? current.publisher.first_name,
 last_name: user?.last_name ?? current.publisher.last_name,
 avatar: user?.avatar ?? current.publisher.avatar,
 is_verified: user?.is_verified ?? current.publisher.is_verified,
 is_online: current.publisher.is_online,
 is_pro: user?.is_pro ?? current.publisher.is_pro,
 };

 return (
 <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={onClose}>
 {/* Prev arrow */}
 {currentIndex > 0 && (
 <Button
 variant="ghost" size="icon"
 className="absolute left-4 text-white hover:bg-white/20 z-20"
 onClick={(e) => { e.stopPropagation(); goPrev(); }}
 >
 <ChevronLeft className="h-8 w-8" />
 </Button>
 )}

 <div
 className={`grid h-full max-h-[92vh] w-full overflow-hidden border bg-zinc-950 shadow-md ${
 isOwnStory ? "max-w-6xl lg:grid-cols-[minmax(0,1fr)_320px]" : "max-w-4xl"
 }`}
 onClick={(e) => e.stopPropagation()}
 >
 <div className="relative min-h-[70vh]">
 <div className="absolute left-2 right-2 top-2 z-10 flex gap-1">
 {visibleStories.map((_, i) => (
 <div key={i} role="progressbar" aria-valuenow={i < currentIndex ? 100 : i === currentIndex ? progress : 0} aria-valuemin={0} aria-valuemax={100} className="h-1 flex-1 overflow-hidden border border-white/30 bg-white/10">
 <div
 className="h-full bg-white transition-none"
 style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress}%` : "0%" }}
 />
 </div>
 ))}
 </div>

 {publisher && (
 <div className="absolute top-6 left-3 z-10 flex items-center gap-2">
 <Link href={`/profile/${publisher.username}`}>
 <Avatar className="h-10 w-10 border-2 border-white">
 <AvatarImage src={resolveAvatarUrl(publisher.avatar)} />
 <AvatarFallback>{publisher.first_name?.[0]}</AvatarFallback>
 </Avatar>
 </Link>
 <div>
 <Link href={`/profile/${publisher.username}`} className="text-sm font-semibold text-white hover:underline">
 {publisher.first_name} {publisher.last_name}
 </Link>
 <p className="text-[11px] text-white/65">{formatDistanceToNow(current.created_at)}</p>
 </div>
 </div>
 )}

 <div className="absolute top-6 right-3 z-20 flex items-center gap-1">
 <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setPaused((p) => !p)}>
 {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
 </Button>
 {isVideo && (
 <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setMuted((m) => !m)}>
 {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
 </Button>
 )}
 {isOwnStory && (
 <Button
 variant="ghost"
 size="icon"
 className="h-8 w-8 text-white hover:bg-red-500/20"
 disabled={deleting}
 onClick={async () => {
 setDeleting(true);
 try {
 await storiesApi.deleteStory(current.story_id);
 toast.success("Story deleted");
 const nextStories = visibleStories.filter(
 (story) => story.story_media_id !== current.story_media_id,
 );
 if (nextStories.length === 0) {
 onClose();
 return;
 }
 setVisibleStories(nextStories);
 setCurrentIndex((index) => Math.min(index, nextStories.length - 1));
 setProgress(0);
 } catch {
 toast.error("Failed to delete story");
 } finally {
 setDeleting(false);
 }
 }}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 )}
 <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={onClose}>
 <X className="h-4 w-4" />
 </Button>
 </div>

 {isVideo ? (
 <video
 ref={videoRef}
 src={current.media.url}
 className="h-full w-full object-contain"
 style={current.filter_css ? { filter: current.filter_css } : undefined}
 autoPlay
 muted={muted}
 playsInline
 onPause={() => setPaused(true)}
 onPlay={() => setPaused(false)}
 />
 ) : (
 <Image
 src={current.media.url}
 alt="Story content"
 fill
 unoptimized
 className="object-contain"
 style={current.filter_css ? { filter: current.filter_css } : undefined}
 />
 )}

 <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

 {current.text && (
 <div className="absolute bottom-28 left-0 right-0 z-10 px-6 text-center">
 <p
 className="text-lg font-semibold drop-shadow-lg"
 style={{
 color: current.text_style_color ?? "#ffffff",
 fontFamily: current.text_style_font ?? undefined,
 }}
 >
 {current.text}
 </p>
 </div>
 )}

 <button
 onClick={goPrev}
 className="absolute left-0 top-0 bottom-0 w-1/3"
 onMouseDown={() => setPaused(true)}
 onMouseUp={() => setPaused(false)}
 onTouchStart={() => setPaused(true)}
 onTouchEnd={() => setPaused(false)}
 />
 <button
 onClick={goNext}
 className="absolute right-0 top-0 bottom-0 w-1/3"
 onMouseDown={() => setPaused(true)}
 onMouseUp={() => setPaused(false)}
 onTouchStart={() => setPaused(true)}
 onTouchEnd={() => setPaused(false)}
 />

 <div className="absolute bottom-5 left-4 right-4 z-10 space-y-3">
 <div className="flex items-center justify-between text-xs text-white/70">
 <div className="flex items-center gap-2">
 <Eye className="h-3.5 w-3.5" />
 <span>{current.view_count ?? 0} views</span>
 </div>
 <span>
 {currentIndex + 1} / {visibleStories.length}
 </span>
 </div>

 <div className="flex items-center justify-center gap-2">
 <Button
 variant="ghost"
 size="icon"
 className="h-9 w-9 border-2 border-white bg-white/10 text-white hover:bg-white/20"
 onClick={goPrev}
 disabled={currentIndex === 0}
 >
 <ChevronLeft className="h-5 w-5" />
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="h-9 w-9 border-2 border-white bg-white/10 text-white hover:bg-white/20"
 onClick={goNext}
 >
 <ChevronRight className="h-5 w-5" />
 </Button>
 </div>

 {!isOwnStory && (
 <>
 <div className="flex justify-center gap-2">
 {REACTIONS.map((emoji) => (
 <button
 key={emoji}
 onClick={async () => {
 try {
 await storiesApi.reactToStory(current.story_media_id, emoji === reacted ? "" : emoji);
 setReacted(emoji === reacted ? null : emoji);
 } catch (e) { console.error("[StoryViewer] react failed", e); }
 }}
 className={`text-xl transition-transform hover:scale-125 ${
 reacted === emoji ? "scale-125" : "opacity-70 hover:opacity-100"
 }`}
 >
 {emoji}
 </button>
 ))}
 </div>
 <div className="flex gap-2">
 <Input
 value={reply}
 onChange={(e) => setReply(e.target.value)}
 placeholder="Send a reply..."
 className="h-10 flex-1 border-2 border-white bg-white/10 text-white placeholder:text-white/50 focus:border-primary"
 onFocus={() => setPaused(true)}
 onBlur={() => { if (!reply) setPaused(false); }}
 onKeyDown={async (e) => {
 if (e.key === "Enter" && reply.trim()) {
 setSendingReply(true);
 try {
 await storiesApi.replyToStory(current.story_media_id, reply);
 setReply("");
 setPaused(false);
 } catch (e) { console.error("[StoryViewer] reply failed", e); }
 finally { setSendingReply(false); }
 }
 }}
 />
 <Button
 size="sm"
 variant="ghost"
 className="h-10 px-3 text-white hover:bg-white/10"
 disabled={!reply.trim() || sendingReply}
 onClick={async () => {
 if (!reply.trim()) return;
 setSendingReply(true);
 try {
 await storiesApi.replyToStory(current.story_media_id, reply);
 setReply("");
 setPaused(false);
 } catch (e) { console.error("[StoryViewer] reply send failed", e); }
 finally { setSendingReply(false); }
 }}
 >
 <Send className="h-4 w-4" />
 </Button>
 {/* C9 — Open the story in a full chat window with a banner */}
 <Button
 size="sm"
 variant="ghost"
 className="h-10 px-3 text-white hover:bg-white/10"
 disabled={openingChat}
 title="Reply from chat"
 onClick={async () => {
 if (!current) return;
 setOpeningChat(true);
 try {
 const conv = await messagesApi.createConversation(current.publisher.id);
 router.push(`/messages/${conv.id}?reply_story=${current.story_media_id}`);
 onClose();
 } catch {
 toast.error("Failed to open chat");
 } finally {
 setOpeningChat(false);
 }
 }}
 >
 <MessageCircle className="h-4 w-4" />
 </Button>
 </div>
 </>
 )}
 </div>
 </div>

 {isOwnStory && (
 <aside className="hidden border-l border-border bg-zinc-900/95 lg:flex lg:flex-col">
 <div className="border-b bg-zinc-950/40 px-5 py-4">
 <p className="text-[15px] font-semibold text-white">
 Story activity
 </p>
 <p className="mt-1 text-xs text-white/60">
 Insights stay visible beside the story while viewers navigate.
 </p>
 </div>
 <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold text-white/85">
 <Eye className="h-4 w-4" />
 <span>{current.view_count ?? 0} total views</span>
 </div>
 <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
 {loadingViewers ? (
 <p className="px-2 text-[15px] font-semibold text-white/60">
 Loading viewers...
 </p>
 ) : viewers.length === 0 ? (
 <p className="px-2 text-[15px] font-semibold text-white/60">
 No viewers yet.
 </p>
 ) : (
 <div className="space-y-2">
 {viewers.map((viewer) => (
 <div
 key={`${viewer.user_id}-${viewer.viewed_at}`}
 className="flex items-center gap-3 border-2 border-white/40 bg-white/5 px-2 py-2 text-white hover:bg-white/10"
 >
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(viewer.avatar)} />
 <AvatarFallback>{viewer.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold">
 {viewer.first_name} {viewer.last_name}
 </p>
 <p className="truncate text-xs text-white/55">@{viewer.username}</p>
 </div>
 <span className="text-[13px] font-medium text-white/45">
 {formatDistanceToNow(viewer.viewed_at)}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </aside>
 )}
 </div>

 {/* Next arrow */}
 {currentIndex < visibleStories.length - 1 && (
 <Button
 variant="ghost" size="icon"
 className="absolute right-4 text-white hover:bg-white/20 z-20"
 onClick={(e) => { e.stopPropagation(); goNext(); }}
 >
 <ChevronRight className="h-8 w-8" />
 </Button>
 )}
 </div>
 );
}
