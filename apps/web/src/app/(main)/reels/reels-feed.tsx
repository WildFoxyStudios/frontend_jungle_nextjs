"use client";

import {
 useCallback,
 useEffect,
 useRef,
 useState,
 createContext,
 useContext,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIntersection } from "@jungle/hooks";
import { mediaApi, postsApi, usersApi } from "@jungle/api-client";
import type { Reel, Comment } from "@jungle/api-client";
import { useAuthStore } from "@jungle/hooks";
import {
 Button,
 Skeleton,
 Input,
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuSub,
 DropdownMenuSubContent,
 DropdownMenuSubTrigger,
 DropdownMenuTrigger,
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@jungle/ui";
import {
 Heart,
 MessageCircle,
 Plus,
 Send,
 X,
 Share2,
 Volume2,
 VolumeX,
 Maximize2,
 Minimize2,
 Bookmark,
 MoreHorizontal,
 Flag,
 Link2,
 Gauge,
 EyeOff,
 Trash2,
 Music2,
} from "lucide-react";
import { toast } from "sonner";

const MUTE_KEY = "jungle-reels-muted";

const ReelMuteContext = createContext<{
 muted: boolean;
 setMuted: (v: boolean) => void;
}>({ muted: true, setMuted: () => undefined });

export type ReelsFeedProps = { initialReels?: Reel[] };

/** Main reels UI; usable from `/reels` (no seed) or from `ReelDeepLinkClient` with `initialReels`. */
export function ReelsFeed({ initialReels }: ReelsFeedProps) {
 const searchParams = useSearchParams();
 const filterQ = (searchParams.get("filter") as "following" | null) || undefined;
 const [reels, setReels] = useState<Reel[]>(initialReels ?? []);
 const [cursor, setCursor] = useState<string | undefined>();
 const [hasMore, setHasMore] = useState(true);
 const [loading, setLoading] = useState(!initialReels?.length);
 const [filter, setFilter] = useState<"for_you" | "following" | "explore">(
 filterQ === "following" ? "following" : "for_you",
 );
 const [muted, setMutedState] = useState(true);
 const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
 const [sentinelRef, sentinelVisible] = useIntersection({ threshold: 0, rootMargin: "400px" });

 const removeReel = useCallback((id: number) => {
 setReels((prev) => prev.filter((r) => r.id !== id));
 }, []);

 useEffect(() => {
 if (typeof window === "undefined") return;
 const s = sessionStorage.getItem(MUTE_KEY);
 if (s === "0") setMutedState(false);
 }, []);

 const setMuted = useCallback((v: boolean) => {
 setMutedState(v);
 try {
 sessionStorage.setItem(MUTE_KEY, v ? "1" : "0");
 } catch {
 /* ignore */
 }
 }, []);

 const load = useCallback(async () => {
 if (!hasMore) return;
 try {
 const r =
 filter === "explore"
 ? await mediaApi.getReelsExplore(cursor)
 : await mediaApi.getReels(cursor, filter === "following" ? "following" : undefined);
 setReels((prev) => {
 const ids = new Set(prev.map((p) => p.id));
 const next = [...prev];
 for (const d of r.data) {
 if (!ids.has(d.id)) {
 ids.add(d.id);
 next.push(d);
 }
 }
 return next;
 });
 setCursor(r.meta.cursor != null ? String(r.meta.cursor) : undefined);
 setHasMore(r.meta.has_more);
 } catch {
 /* silent */
 } finally {
 setLoading(false);
 }
 }, [cursor, hasMore, filter]);

 useEffect(() => {
 setReels([]);
 setCursor(undefined);
 setHasMore(true);
 setLoading(true);
 }, [filter]);

 useEffect(() => {
 if (initialReels?.length) return;
 void load();
 }, [load, initialReels?.length]);

 useEffect(() => {
 if (!initialReels?.length) return;
 const seed = initialReels[0].id;
 void (async () => {
 try {
 const r =
 filter === "explore"
 ? await mediaApi.getReelsExplore(String(seed))
 : await mediaApi.getReels(String(seed), filter === "following" ? "following" : undefined);
 setReels((prev) => {
 const ids = new Set(prev.map((p) => p.id));
 return [...prev, ...r.data.filter((d) => !ids.has(d.id))];
 });
 setCursor(r.meta.cursor != null ? String(r.meta.cursor) : undefined);
 setHasMore(r.meta.has_more);
 } catch {
 /* */
 } finally {
 setLoading(false);
 }
 })();
 }, [initialReels, filter]);

 // Load more when last card approaches (penultimate visible pattern via index)
 useEffect(() => {
 if (sentinelVisible) void load();
 }, [sentinelVisible, load]);

 useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
 const y = window.scrollY;
 const h = window.innerHeight;
 const i = Math.round(y / h);
 if (e.code === "ArrowDown" || e.code === "Space") {
 e.preventDefault();
 const next = (i + 1) * h;
 window.scrollTo({ top: next, behavior: "smooth" });
 } else if (e.code === "ArrowUp") {
 e.preventDefault();
 const prev = Math.max(0, (i - 1) * h);
 window.scrollTo({ top: prev, behavior: "smooth" });
 }
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, []);

 return (
 <ReelMuteContext.Provider value={{ muted, setMuted }}>
 <div className="relative">
 <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
 <div className="flex items-center gap-1 rounded border bg-background px-1 py-0.5">
 <Button
 size="sm"
 variant={filter === "for_you" ? "default" : "ghost"}
 onClick={() => setFilter("for_you")}
 >
 For you
 </Button>
 <Button
 size="sm"
 variant={filter === "following" ? "default" : "ghost"}
 onClick={() => setFilter("following")}
 >
 Following
 </Button>
 <Button
 size="sm"
 variant={filter === "explore" ? "default" : "ghost"}
 onClick={() => setFilter("explore")}
 >
 Explore
 </Button>
 </div>
 <div className="flex gap-1">
 <Button
 size="icon"
 variant="outline"
 className="h-8 w-8"
 onClick={() => setMuted(!muted)}
 aria-label={muted ? "Unmute" : "Mute"}
 >
 {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
 </Button>
 <Button asChild size="sm" className="gap-1.5">
 <Link href="/reels/create">
 <Plus className="h-4 w-4" /> Create
 </Link>
 </Button>
 </div>
 </div>
 <div className="mx-auto max-w-sm snap-y snap-mandatory overflow-y-scroll h-dvh">
 {loading && [1, 2].map((i) => <Skeleton key={i} className="w-full snap-start h-dvh" />)}
 {reels.map((reel, i) => (
 <ReelCard
 key={reel.id}
 reel={reel}
 onRemoveReel={removeReel}
 setRef={(el) => {
 cardRefs.current[i] = el;
 }}
 />
 ))}
 <div ref={sentinelRef} className="h-1 w-full shrink-0" />
 </div>
 </div>
 </ReelMuteContext.Provider>
 );
}

function ReelCard({
 reel,
 setRef,
 onRemoveReel,
}: {
 reel: Reel;
 setRef: (el: HTMLDivElement | null) => void;
 onRemoveReel?: (id: number) => void;
}) {
 const { user } = useAuthStore();
 const { muted } = useContext(ReelMuteContext);
 const [liked, setLiked] = useState(!!reel.my_reaction);
 const [likes, setLikes] = useState(reel.like_count);
 const [saved, setSaved] = useState(reel.is_saved === true);
 const [following, setFollowing] = useState(reel.is_following === true);
 const [playbackRate, setPlaybackRate] = useState(1);
 const [showComments, setShowComments] = useState(false);
 const [comments, setComments] = useState<Comment[]>([]);
 const [commentCursor, setCommentCursor] = useState<string | undefined>();
 const [hasMoreComments, setHasMoreComments] = useState(false);
 const [commentsLoading, setCommentsLoading] = useState(false);
 const [newComment, setNewComment] = useState("");
 const [sendingComment, setSendingComment] = useState(false);
 const [canPlay, setCanPlay] = useState(false);
 const [progress, setProgress] = useState(0);
 const [reportedView, setReportedView] = useState(false);
 const [reportReason, setReportReason] = useState("");
 const [showReportDialog, setShowReportDialog] = useState(false);
 const [fullscreenReel, setFullscreenReel] = useState(false);
 const [captionExpanded, setCaptionExpanded] = useState(false);
 const videoRef = useRef<HTMLVideoElement>(null);
 const rootRef = useRef<HTMLDivElement>(null);
 const seenLocal = useRef<Set<number>>(new Set());
 const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const lastInsightAt = useRef(0);

 const videoUrl = reel.video?.url ?? "";
 const posterUrl = reel.thumbnail || reel.video?.thumbnail || "";
 const publisherName = reel.publisher?.username ?? "unknown";
 const profileHref = `/profile/${encodeURIComponent(publisherName)}`;
 const commentsOff = reel.comments_status === 1;

 useEffect(() => {
 return () => {
 if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
 };
 }, []);

 useEffect(() => {
 const v = videoRef.current;
 const root = rootRef.current;
 if (!v || !root) return;
 const io = new IntersectionObserver(
 (entries) => {
 for (const e of entries) {
 if (e.intersectionRatio > 0.6) {
 void v.play().catch(() => undefined);
 } else {
 v.pause();
 v.currentTime = 0;
 }
 }
 },
 { threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] },
 );
 io.observe(root);
 return () => io.disconnect();
 }, []);

 useEffect(() => {
 const v = videoRef.current;
 if (!v) return;
 v.muted = muted;
 }, [muted]);

 useEffect(() => {
 const v = videoRef.current;
 if (v) v.playbackRate = playbackRate;
 }, [playbackRate]);

 const isOwner = user != null && Number(user.id) === Number(reel.user_id);

 useEffect(() => {
 const sync = () => {
 const root = rootRef.current;
 setFullscreenReel(Boolean(root && document.fullscreenElement === root));
 };
 document.addEventListener("fullscreenchange", sync);
 return () => document.removeEventListener("fullscreenchange", sync);
 }, []);

 const toggleFullscreen = useCallback(() => {
 const root = rootRef.current;
 const v = videoRef.current;
 if (!root) return;
 if (document.fullscreenElement === root) {
 void document.exitFullscreen().catch(() => undefined);
 return;
 }
 const ve = v as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
 if (ve && typeof ve.webkitEnterFullscreen === "function") {
 try {
 ve.webkitEnterFullscreen();
 } catch {
 /* iOS may reject if not user gesture */
 }
 return;
 }
 void root.requestFullscreen?.().catch(() => undefined);
 }, []);

 const reportViewIfNeeded = useCallback(() => {
 if (reportedView || seenLocal.current.has(reel.id)) return;
 seenLocal.current.add(reel.id);
 setReportedView(true);
 void mediaApi.viewReel(reel.id).catch(() => undefined);
 }, [reel.id, reportedView]);

 const onTimeUpdate = useCallback(() => {
 const v = videoRef.current;
 if (!v || !v.duration) return;
 setProgress((v.currentTime / v.duration) * 100);
 if (v.currentTime > v.duration * 0.5) reportViewIfNeeded();
 if (user) {
 const now = Date.now();
 if (now - lastInsightAt.current > 5000) {
 lastInsightAt.current = now;
 const bucket = Math.min(119, Math.max(0, Math.floor(v.currentTime)));
 void mediaApi.postReelInsight(reel.id, bucket).catch(() => undefined);
 }
 }
 }, [reportViewIfNeeded, reel.id, user]);

 const onProgressSeek = useCallback((clientX: number, bar: HTMLDivElement) => {
 const v = videoRef.current;
 if (!v || !v.duration) return;
 const rect = bar.getBoundingClientRect();
 const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
 v.currentTime = pct * v.duration;
 }, []);

 const handleLike = async () => {
 const prevL = likes;
 const prevK = liked;
 try {
 if (liked) {
 setLiked(false);
 setLikes((l) => Math.max(0, l - 1));
 await mediaApi.reactToReel(reel.id, "");
 } else {
 setLiked(true);
 setLikes((l) => l + 1);
 await mediaApi.reactToReel(reel.id, "like");
 }
 } catch {
 setLiked(prevK);
 setLikes(prevL);
 toast.error("Failed to update like");
 }
 };

 const loadComments = async (append: boolean) => {
 if (commentsLoading) return;
 setCommentsLoading(true);
 try {
 const cur = append ? commentCursor : undefined;
 const r = await mediaApi.getReelComments(reel.id, cur);
 if (append) {
 setComments((prev) => [...prev, ...r.data]);
 } else {
 setComments(r.data);
 }
 setCommentCursor(r.meta.cursor);
 setHasMoreComments(!!r.meta.has_more);
 } catch {
 /* silent */
 } finally {
 setCommentsLoading(false);
 }
 };

 const sendComment = async () => {
 if (!newComment.trim()) return;
 setSendingComment(true);
 try {
 await mediaApi.addReelComment(reel.id, newComment);
 setNewComment("");
 setCommentCursor(undefined);
 await loadComments(false);
 } catch {
 toast.error("Failed to send comment");
 } finally {
 setSendingComment(false);
 }
 };

 const handleShare = async () => {
 const url = typeof window !== "undefined" ? `${window.location.origin}/reels/${reel.id}` : "";
 try {
 await mediaApi.shareReel(reel.id);
 if (navigator.share) {
 await navigator.share({ title: "Reel", url });
 } else {
 await navigator.clipboard.writeText(url);
 toast.success("Link copied");
 }
 } catch (e) {
 if (e && typeof (e as Error).name === "string" && (e as Error).name === "AbortError") return;
 try {
 await navigator.clipboard.writeText(url);
 toast.success("Link copied");
 } catch {
 toast.error("Share failed");
 }
 }
 };

 const toggleSave = async () => {
 const prev = saved;
 setSaved(!prev);
 try {
 if (prev) await postsApi.unsavePost(reel.id);
 else await postsApi.savePost(reel.id);
 } catch {
 setSaved(prev);
 toast.error("Could not update save");
 }
 };

 const toggleFollow = async () => {
 const uid = reel.publisher.id;
 const prev = following;
 setFollowing(!prev);
 try {
 if (prev) await usersApi.unfollow(uid);
 else await usersApi.follow(uid);
 } catch {
 setFollowing(prev);
 toast.error("Could not update follow");
 }
 };

 const copyReelLink = async () => {
 const url = `${window.location.origin}/reels/${reel.id}`;
 try {
 await navigator.clipboard.writeText(url);
 toast.success("Link copied");
 } catch {
 toast.error("Copy failed");
 }
 };

 const onNotInterested = async () => {
 try {
 await postsApi.hidePost(reel.id);
 toast("We will show fewer reels like this.");
 onRemoveReel?.(reel.id);
 } catch {
 toast.error("Could not hide this reel");
 }
 };

 const openReportDialog = () => {
 setReportReason("");
 setShowReportDialog(true);
 };

 const submitReport = async () => {
 const reason = reportReason.trim();
 if (!reason) return;
 setShowReportDialog(false);
 try {
 await usersApi.createReport({
 target_type: "reel",
 target_id: reel.id,
 reason: reason.trim(),
 });
 toast.success("Report submitted");
 } catch {
 toast.error("Report failed");
 }
 };

 const onDeleteOwn = async () => {
 if (typeof window !== "undefined" && !window.confirm("Delete this reel permanently?")) return;
 try {
 await mediaApi.deleteReel(reel.id);
 toast.success("Reel deleted");
 onRemoveReel?.(reel.id);
 } catch {
 toast.error("Delete failed");
 }
 };

 const applySpeed = (rate: number) => {
 setPlaybackRate(rate);
 const v = videoRef.current;
 if (v) v.playbackRate = rate;
 };

 return (
 <div ref={(el) => { rootRef.current = el; setRef(el); }} className="relative snap-start bg-black overflow-hidden h-dvh">
 {!canPlay && videoUrl && (
 <Skeleton className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-50" aria-hidden />
 )}

 {videoUrl ? (
 <video
 ref={videoRef}
 src={videoUrl}
 poster={posterUrl || undefined}
 className="relative z-0 h-full w-full object-cover"
 loop
 muted={muted}
 playsInline
 title="Tap to play or pause; double-click for fullscreen"
 onCanPlay={() => setCanPlay(true)}
 onTimeUpdate={onTimeUpdate}
 onClick={() => {
 if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
 tapTimerRef.current = setTimeout(() => {
 tapTimerRef.current = null;
 const v = videoRef.current;
 if (!v) return;
 if (v.paused) void v.play().catch(() => undefined);
 else v.pause();
 }, 220);
 }}
 onDoubleClick={(e) => {
 e.preventDefault();
 if (tapTimerRef.current) {
 clearTimeout(tapTimerRef.current);
 tapTimerRef.current = null;
 }
 toggleFullscreen();
 }}
 />
 ) : (
 <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-sm text-white/60">
 Video unavailable
 </div>
 )}

 <div
 className="absolute bottom-0 left-0 right-0 z-20 h-2 cursor-pointer bg-white/25"
 onClick={(e) => onProgressSeek(e.clientX, e.currentTarget)}
 title="Seek"
 >
 <div className="pointer-events-none h-full bg-white/90" style={{ width: `${progress}%` }} />
 </div>

 <div className="absolute bottom-4 left-4 right-[4.5rem] z-20 text-white">
 <div className="flex flex-wrap items-center gap-2">
 <Link href={profileHref} className="font-semibold text-sm hover:underline">
 @{publisherName}
 </Link>
 {user && !isOwner ? (
 <button
 type="button"
 onClick={() => void toggleFollow()}
 className={
 "rounded border border-white/80 px-2 py-0.5 text-[11px] font-semibold " +
 (following ? "bg-white/15 text-white" : "bg-white text-black")
 }
 >
 {following ? "Following" : "Follow"}
 </button>
 ) : null}
 </div>
 {typeof reel.view_count === "number" ? (
 <p className="mt-0.5 text-[11px] font-bold text-white/70">
 {reel.view_count.toLocaleString()} views
 </p>
 ) : null}
 {reel.audio && reel.audio.title ? (
 <div className="mt-1 flex max-w-full items-center gap-1.5 rounded-full border border-white/35 bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white/95">
 <Music2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
 <span className="min-w-0 truncate">{reel.audio.title}</span>
 {reel.audio.artist_label ? (
 <span className="shrink-0 truncate text-white/70">· {reel.audio.artist_label}</span>
 ) : null}
 </div>
 ) : null}
 {reel.caption ? (
 <div className="mt-1 text-xs">
 <p className={captionExpanded ? "text-white" : "line-clamp-3 text-white"}>
 <CaptionWithTags text={reel.caption} />
 </p>
 {reel.caption.length > 80 ? (
 <button
 type="button"
 onClick={() => setCaptionExpanded((x) => !x)}
 className="mt-0.5 text-[11px] font-medium text-sky-300 hover:underline"
 >
 {captionExpanded ? "Less" : "More"}
 </button>
 ) : null}
 </div>
 ) : null}
 </div>

 <div className="absolute right-2 bottom-16 z-20 flex flex-col items-center gap-3 text-white sm:right-3 sm:gap-4">
 <button type="button" onClick={handleLike} className="flex flex-col items-center gap-0.5 drop-shadow-md">
 <Heart className={"h-7 w-7 sm:h-8 sm:w-8 " + (liked ? "fill-red-500 text-red-500" : "")} />
 <span className="text-[11px] font-bold">{likes}</span>
 </button>
 <button
 type="button"
 disabled={commentsOff}
 title={commentsOff ? "Comments are turned off" : undefined}
 onClick={() => {
 if (commentsOff) return;
 if (!showComments) void loadComments(false);
 setShowComments((v) => !v);
 }}
 className={
 "flex flex-col items-center gap-0.5 drop-shadow-md " +
 (commentsOff ? "cursor-not-allowed opacity-40" : "")
 }
 >
 <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8" />
 <span className="text-[11px] font-bold">{reel.comment_count}</span>
 </button>
 <button type="button" onClick={handleShare} className="flex flex-col items-center gap-0.5 drop-shadow-md">
 <Share2 className="h-7 w-7 sm:h-8 sm:w-8" />
 <span className="text-[11px] font-bold">Share</span>
 </button>
 <button
 type="button"
 onClick={() => void toggleSave()}
 className="flex flex-col items-center gap-0.5 drop-shadow-md"
 aria-label={saved ? "Remove from saved" : "Save reel"}
 >
 <Bookmark className={"h-7 w-7 sm:h-8 sm:w-8 " + (saved ? "fill-amber-300 text-amber-300" : "")} />
 <span className="text-[11px] font-bold">Save</span>
 </button>
 {videoUrl ? (
 <button
 type="button"
 onClick={() => toggleFullscreen()}
 className="flex flex-col items-center gap-0.5 drop-shadow-md"
 aria-label={fullscreenReel ? "Exit fullscreen" : "Fullscreen"}
 title={fullscreenReel ? "Exit fullscreen" : "Fullscreen (double-click video)"}
 >
 {fullscreenReel ? (
 <Minimize2 className="h-7 w-7 sm:h-8 sm:w-8" />
 ) : (
 <Maximize2 className="h-7 w-7 sm:h-8 sm:w-8" />
 )}
 <span className="text-[11px] font-bold">{fullscreenReel ? "Exit" : "Expand"}</span>
 </button>
 ) : null}
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button
 type="button"
 className="flex flex-col items-center gap-0.5 drop-shadow-md"
 aria-label="More options"
 >
 <MoreHorizontal className="h-7 w-7 sm:h-8 sm:w-8" />
 <span className="text-[11px] font-bold">More</span>
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent side="left" align="end" className="w-52 border shadow-md">
 <DropdownMenuSub>
 <DropdownMenuSubTrigger className="gap-2 font-semibold">
 <Gauge className="h-4 w-4" /> Playback speed
 </DropdownMenuSubTrigger>
 <DropdownMenuSubContent className="border">
 {[0.75, 1, 1.25, 1.5, 2].map((r) => (
 <DropdownMenuItem key={r} onClick={() => applySpeed(r)} className="font-medium">
 {r === 1 ? "Normal (1×)" : `${r}×`}
 {playbackRate === r ? " ✓" : ""}
 </DropdownMenuItem>
 ))}
 </DropdownMenuSubContent>
 </DropdownMenuSub>
 <DropdownMenuItem onClick={() => void copyReelLink()} className="gap-2 font-semibold">
 <Link2 className="h-4 w-4" /> Copy link
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => void onNotInterested()} className="gap-2 font-semibold">
 <EyeOff className="h-4 w-4" /> Not interested
 </DropdownMenuItem>
 <DropdownMenuItem onClick={() => openReportDialog()} className="gap-2 font-semibold">
 <Flag className="h-4 w-4" /> Report
 </DropdownMenuItem>
 {isOwner ? (
 <>
 <DropdownMenuSeparator />
 <DropdownMenuItem
 onClick={() => void onDeleteOwn()}
 className="gap-2 font-semibold text-destructive focus:text-destructive"
 >
 <Trash2 className="h-4 w-4" /> Delete reel
 </DropdownMenuItem>
 </>
 ) : null}
 </DropdownMenuContent>
 </DropdownMenu>
 </div>

 {showComments && !commentsOff && (
 <div className="absolute inset-x-0 bottom-0 z-30 border-t border-white/40 bg-black/80 backdrop-blur max-h-[50vh] flex flex-col shadow-md">
 <div className="flex items-center justify-between px-4 py-3 border-b border-white/40">
 <span className="text-white text-sm font-semibold">Comments</span>
 <button type="button" onClick={() => setShowComments(false)} className="text-white/70 hover:text-white">
 <X className="h-4 w-4" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
 {comments.length === 0 && !commentsLoading ? (
 <p className="text-white/50 text-xs text-center py-4 font-medium">No comments yet</p>
 ) : (
 comments.map((c) => <ReelCommentRow key={c.id} comment={c} depth={0} />)
 )}
 {hasMoreComments && (
 <div className="flex justify-center py-2">
 <Button
 type="button"
 size="sm"
 variant="ghost"
 className="text-white/80 text-xs"
 disabled={commentsLoading}
 onClick={() => void loadComments(true)}
 >
 {commentsLoading ? "Loading…" : "Load more"}
 </Button>
 </div>
 )}
 </div>
 <div className="flex gap-2 p-3 border-t border-white/40">
 <Input
 value={newComment}
 onChange={(e) => setNewComment(e.target.value)}
 placeholder="Add a comment…"
 className="flex-1 border border-white/40 bg-white/10 text-white placeholder:text-white/40 text-sm"
 onKeyDown={(e) => { if (e.key === "Enter") void sendComment(); }}
 />
 <Button
 size="sm"
 variant="ghost"
 onClick={() => void sendComment()}
 disabled={sendingComment || !newComment.trim()}
 className="text-white"
 >
 <Send className="h-4 w-4" />
 </Button>
 </div>
 </div>
 )}

      <AlertDialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Report this reel</AlertDialogTitle>
          </AlertDialogHeader>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Describe the issue"
            className="mt-2"
          />
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitReport()} disabled={!reportReason.trim()}>Submit report</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
 </div>
 );
}

function ReelCommentRow({ comment, depth }: { comment: Comment; depth: number }) {
 const name = comment.publisher?.username ?? "unknown";
 return (
 <div
 className={"text-sm " + (depth > 0 ? "pl-3 border-l border-white/30 mt-1" : "")}
 >
 <span className="text-white font-bold">@{name} </span>
 <span className="text-white/80">{comment.content}</span>
 {comment.replies && comment.replies.length > 0 && (
 <div className="mt-1 space-y-1">
 {comment.replies.map((r) => (
 <ReelCommentRow key={r.id} comment={r} depth={depth + 1} />
 ))}
 </div>
 )}
 </div>
 );
}

function CaptionWithTags({ text }: { text: string }) {
 const parts = text.split(/(#[\w]+|@[\w]+)/g);
 return (
 <>
 {parts.map((p, i) => {
 if (p.startsWith("#") && p.length > 1) {
 const tag = p.slice(1);
 return (
 <Link key={i} href={`/hashtags/${encodeURIComponent(tag.toLowerCase())}`} className="text-sky-300 hover:underline">
 {p}
 </Link>
 );
 }
 if (p.startsWith("@") && p.length > 1) {
 const u = p.slice(1);
 return (
 <Link key={i} href={`/profile/${encodeURIComponent(u.toLowerCase())}`} className="text-amber-200 hover:underline">
 {p}
 </Link>
 );
 }
 return <span key={i}>{p}</span>;
 })}
 </>
 );
}
