"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { Post, Comment as CommentT } from "@jungle/api-client";
import { postsApi } from "@jungle/api-client";
import { useAuthStore, usePublicConfig } from "@jungle/hooks";
import { useTranslations } from "next-intl";
import {
 Avatar, AvatarFallback, AvatarImage,
} from "@jungle/ui";
import {
 MapPin, Globe, Lock, Users, FileText, ExternalLink, Loader2,
 ShieldAlert, UserCheck, UserPlus, BadgeCheck, Star, Megaphone, TrendingUp,
} from "lucide-react";
import { CommentList } from "./CommentList";
import { CommentForm } from "./CommentForm";
import { AudioPlayer } from "@/components/shared/AudioPlayer";
import { PollVoting } from "./PollVoting";
import { UserHoverCard } from "@/components/shared/UserHoverCard";
import { GroupHoverCard } from "@/components/shared/GroupHoverCard";
import { PageHoverCard } from "@/components/shared/PageHoverCard";
import { MediaLightbox } from "@/components/shared/MediaLightbox";
import { resolveAvatarUrl } from "@/lib/avatar";
import { formatDistanceToNow } from "@/lib/date";
import { PostRenderer } from "./post-types/PostRenderer";
import { PostHeaderActions } from "./PostHeaderActions";
import { PostFooterEnriched } from "./PostFooterEnriched";

const PRIVACY_ICON = {
 public: Globe,
 friends: Users,
 only_me: Lock,
 custom: Users,
 anonymous: ShieldAlert,
 people_i_follow: UserCheck,
 people_follow_me: UserPlus,
} as const;

const PRIVACY_LABEL = {
 public: "Public",
 friends: "Friends",
 only_me: "Only me",
 custom: "Custom",
 anonymous: "Anonymous",
 people_i_follow: "People I follow",
 people_follow_me: "My followers",
} as const;

interface PostCardProps {
 post: Post;
 showGroupInfo?: boolean;
 onDelete?: (postId: number) => void;
 priority?: boolean;
 keyboardFocused?: boolean;
}

export const PostCard = React.memo(function PostCard({
 post,
 showGroupInfo,
 onDelete,
 priority,
 keyboardFocused,
}: PostCardProps) {
 const { user } = useAuthStore();
 const { websiteMode } = usePublicConfig();
 const t = useTranslations("post");
 const [showComments, setShowComments] = useState(false);
 const [comments, setComments] = useState<CommentT[]>(post.recent_comments ?? []);
 const [commentCount, setCommentCount] = useState(post.comment_count);
 const [loadingComments, setLoadingComments] = useState(false);
 const [allCommentsLoaded, setAllCommentsLoaded] = useState(false);
 const [myReaction, setMyReaction] = useState(post.my_reaction);
 const [likeCount, setLikeCount] = useState(post.like_count);
 const [shareCount] = useState(post.share_count);
 const [saved, setSaved] = useState(post.is_saved ?? false);
 const [hidden, setHidden] = useState(false);
 const [deleting, setDeleting] = useState(false);
 const [lightboxOpen, setLightboxOpen] = useState(false);
 const [lightboxIndex, setLightboxIndex] = useState(0);

 const pub_ = post.publisher ?? {
 id: post.user_id, uuid: "", username: "unknown", first_name: "User",
 last_name: "", avatar: "", is_verified: false, is_pro: 0, is_online: false,
 };

 const isOwn = !!user && (Number(user.id) === Number(post.user_id) || Number(user.id) === Number(pub_.id));
 const PrivacyIcon = PRIVACY_ICON[post.privacy] ?? Globe;
 const privacyLabel = PRIVACY_LABEL[post.privacy] ?? "Public";

 const isSponsoredPost = Boolean(post.is_ad || post.post_type === "ad");
 const isBoostedPost = Boolean(post.is_boosted);

 const handleReact = async (type: string) => {
 try {
 if (myReaction === type) {
 await postsApi.removeReaction(post.id);
 setMyReaction(undefined);
 setLikeCount((c) => c - 1);
 } else {
 await postsApi.reactToPost(post.id, type);
 if (!myReaction) setLikeCount((c) => c + 1);
 setMyReaction(type);
 }
 } catch {
 toast.error("Could not react to post");
 }
 };

 const handleSave = async () => {
 try {
 if (saved) {
 await postsApi.unsavePost(post.id);
 setSaved(false);
 toast.success("Removed from saved");
 } else {
 await postsApi.savePost(post.id);
 setSaved(true);
 toast.success("Post saved");
 }
 } catch {
 toast.error("Could not save post");
 }
 };

 const handleHide = async () => {
 try {
 await postsApi.hidePost(post.id);
 setHidden(true);
 } catch {
 toast.error("Could not hide post");
 }
 };

 const handleDelete = async () => {
 setDeleting(true);
 try {
 await postsApi.deletePost(post.id);
 toast.success("Post deleted");
 onDelete?.(post.id);
 setHidden(true);
 } catch {
 toast.error("Could not delete post");
 } finally {
 setDeleting(false);
 }
 };

 const handleReport = async (reason: string, details?: string) => {
 await postsApi.reportPost(post.id, reason, details);
 };

 const loadAllComments = useCallback(async () => {
 if (allCommentsLoaded || loadingComments) return;
 setLoadingComments(true);
 try {
 const res = await postsApi.getComments(post.id);
 const all = Array.isArray(res?.data) ? res.data : [];
 setComments(all);
 setAllCommentsLoaded(true);
 } catch {
 toast.error("Could not load comments");
 } finally {
 setLoadingComments(false);
 }
 }, [post.id, allCommentsLoaded, loadingComments]);

 const handleToggleComments = () => {
 const next = !showComments;
 setShowComments(next);
 if (next && !allCommentsLoaded && commentCount > comments.length) {
 loadAllComments();
 }
 };

 const reactRef = useRef(handleReact);
 reactRef.current = handleReact;
 const toggleCommentsRef = useRef(handleToggleComments);
 toggleCommentsRef.current = handleToggleComments;

 useEffect(() => {
 const h = (ev: Event) => {
 const e = ev as CustomEvent<{ action: string; postId: number }>;
 if (e.detail?.postId !== post.id) return;
 if (e.detail.action === "like") void reactRef.current("like");
 else if (e.detail.action === "comment") toggleCommentsRef.current();
 };
 window.addEventListener("wowonder-feed-kbd", h as EventListener);
 return () => window.removeEventListener("wowonder-feed-kbd", h as EventListener);
 }, [post.id]);

 const handleNewComment = (comment: CommentT) => {
 setComments((prev) => [...prev, comment]);
 setCommentCount((c) => c + 1);
 };

 if (hidden) return null;

 const validMedia = (post.media ?? []).filter((m) => {
 const raw = m as unknown as Record<string, unknown>;
 const url = m.url ?? (raw.file_url as string) ?? "";
 return !!url;
 });

 const imageVideoMedia = validMedia.filter((m) => {
 const type = m.type ?? "image";
 return type === "image" || type === "video";
 });

 const audioMedia = validMedia.filter((m) => m.type === "audio");
 if (post.post_type === "audio" && post.media_url) {
 audioMedia.push({
 id: 0,
 url: post.media_url,
 type: "audio",
 name: "Voice Note",
 });
 }
 const fileMedia = validMedia.filter((m) => m.type === "file");

 const lightboxMedia = imageVideoMedia.map((item) => {
 const raw = item as unknown as Record<string, unknown>;
 return {
 url: item.url ?? (raw.file_url as string) ?? "",
 type: (item.type ?? (raw.file_type as string) ?? "image") as "image" | "video",
 };
 });

 const isAnonymous = post.privacy === "anonymous" && !isOwn;
 const hasMedia = imageVideoMedia.length > 0 && post.post_type !== "live";

 return (
 <div
 data-feed-post-card
 data-feed-post-id={post.id}
 {...(keyboardFocused ? { "data-feed-kbd-focused": "true" } : {})}
 data-website-mode={websiteMode}
 className={
 "bg-card rounded-lg overflow-hidden " +
 (keyboardFocused ? "ring-2 ring-primary ring-offset-2 ring-offset-background " : "")
 }
 >
 {/* ── Header ──────────────────────────────────────────────────────── */}
 <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
 <div className="flex min-w-0 items-center gap-2">
 {isAnonymous ? (
 <Avatar className="h-10 w-10 shrink-0">
 <AvatarFallback className="bg-muted text-muted-foreground">
 <ShieldAlert className="h-5 w-5" />
 </AvatarFallback>
 </Avatar>
 ) : (
 <UserHoverCard username={pub_.username}>
 <Link href={`/profile/${pub_.username}`} className="relative block shrink-0">
 <Avatar className="h-10 w-10">
 <AvatarImage src={resolveAvatarUrl(pub_.avatar)} />
 <AvatarFallback>{pub_.first_name?.[0] ?? "?"}</AvatarFallback>
 </Avatar>
 {pub_.is_online && (
 <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
 )}
 </Link>
 </UserHoverCard>
 )}
 <div className="min-w-0">
 {isAnonymous ? (
 <span className="font-semibold text-[15px] text-muted-foreground">Anonymous</span>
 ) : (
 <div className="flex items-center gap-1">
 <UserHoverCard username={pub_.username}>
 <Link href={`/profile/${pub_.username}`} className="font-semibold text-[15px] hover:underline">
 {pub_.first_name} {pub_.last_name}
 </Link>
 </UserHoverCard>
 {pub_.is_verified && (
 <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-primary" title="Verified">
 <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
 </span>
 )}
 </div>
 )}
 <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
 <Link href={`/post/${post.id}`} className="hover:underline">
 {formatDistanceToNow(post.created_at)}
 </Link>
 <span aria-label={privacyLabel} className="inline-flex items-center gap-0.5">
 {" · "}
 <PrivacyIcon className="h-3 w-3" />
 </span>
 {isSponsoredPost && (
 <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
 {" · "}
 <Megaphone className="h-3 w-3" />
 {t("sponsored")}
 </span>
 )}
 {isBoostedPost && (
 <span className="inline-flex items-center gap-1 text-primary font-bold text-[11px]">
 {" · "}
 <TrendingUp className="h-3 w-3" />
 {t("boostedBadge")}
 </span>
 )}
 </div>
 </div>
 </div>
 <PostHeaderActions
 post={post}
 isOwn={isOwn}
 saved={saved}
 deleting={deleting}
 onSaveToggle={handleSave}
 onHide={handleHide}
 onDelete={handleDelete}
 onReport={handleReport}
 />
 </div>

 {/* ── Context line: location, feeling, group/page info ──────────── */}
 {(post.location || post.feeling || (showGroupInfo && post.group_info) || post.page_info) && (
 <div className="px-4 sm:px-5 pb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px] text-muted-foreground">
 {post.feeling && (
 <span>— {t("feeling")} {post.feeling}</span>
 )}
 {post.location && (
 <span className="inline-flex items-center gap-1">
 <MapPin className="h-3 w-3" />
 {post.location}
 </span>
 )}
 {showGroupInfo && post.group_info && (
 <span>
 in{" "}
 <GroupHoverCard slug={String(post.group_info.id)}>
 <Link href={`/groups/${post.group_info.id}`} className="font-semibold hover:underline text-foreground">
 {post.group_info.name}
 </Link>
 </GroupHoverCard>
 </span>
 )}
 {post.page_info && (
 <span>
 via{" "}
 <PageHoverCard slug={String(post.page_info.id)}>
 <Link href={`/pages/${post.page_info.id}`} className="font-semibold hover:underline text-foreground">
 {post.page_info.name}
 </Link>
 </PageHoverCard>
 </span>
 )}
 </div>
 )}

 {/* ── Post content text ─────────────────────────────────────────── */}
 {post.content && (
 <div className="px-4 sm:px-5 pb-1">
 <div className="text-[15px] leading-relaxed">
 <PostRenderer
 post={post}
 onPhotoClick={(idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
 priority={priority}
 />
 </div>
 </div>
 )}

 {/* ── Post content without text (embeds, media, etc.) ───────────── */}
 {!post.content && (
 <div className="px-4 sm:px-5 pb-1">
 <PostRenderer
 post={post}
 onPhotoClick={(idx) => { setLightboxIndex(idx); setLightboxOpen(true); }}
 priority={priority}
 />
 </div>
 )}

 <MediaLightbox
 open={lightboxOpen}
 onClose={() => setLightboxOpen(false)}
 initialIndex={lightboxIndex}
 media={lightboxMedia}
 />

 {/* Audio media */}
 {audioMedia.length > 0 && (
 <div className="px-4 sm:px-5 pb-2 space-y-2">
 {audioMedia.map((item, idx) => {
 const raw = item as unknown as Record<string, unknown>;
 const url = item.url ?? (raw.file_url as string) ?? "";
 const name = item.name ?? (raw.file_name as string) ?? `Audio ${idx + 1}`;
 return <AudioPlayer key={item.id ?? idx} src={url} title={name} />;
 })}
 </div>
 )}

 {/* File attachments */}
 {fileMedia.length > 0 && (
 <div className="px-4 sm:px-5 pb-2 space-y-1">
 {fileMedia.map((item, idx) => {
 const raw = item as unknown as Record<string, unknown>;
 const url = item.url ?? (raw.file_url as string) ?? "";
 const name = item.name ?? (raw.file_name as string) ?? "Attachment";
 return (
 <a
 key={item.id ?? idx}
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
 >
 <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
 <span className="flex-1 truncate font-medium">{name}</span>
 <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
 </a>
 );
 })}
 </div>
 )}

 {/* Poll */}
 {post.poll && (
 <div className="px-4 sm:px-5 pb-2">
 <PollVoting poll={post.poll} postId={post.id} />
 </div>
 )}

 {/* ── Footer: reactions + action bar ────────────────────────────── */}
 <PostFooterEnriched
 postId={post.id}
 postAuthorId={post.publisher?.id ?? post.user_id}
 myReaction={myReaction}
 likeCount={likeCount}
 commentCount={commentCount}
 shareCount={shareCount}
 viewCount={post.view_count}
 reactionCounts={post.reaction_counts}
 onReact={handleReact}
 onToggleComments={handleToggleComments}
 showComments={showComments}
 />

 {/* ── Comments ───────────────────────────────────────────────────── */}
 {showComments && (
 <div className="px-4 sm:px-5 pb-3 pt-1 border-t">
 {loadingComments && (
 <div className="flex items-center justify-center py-3">
 <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
 </div>
 )}
 {comments.length > 0 && (
 <CommentList comments={comments} postId={post.id} />
 )}
 {!allCommentsLoaded && commentCount > comments.length && !loadingComments && (
 <button
 type="button"
 onClick={loadAllComments}
 className="text-[13px] font-semibold text-muted-foreground hover:underline py-1"
 >
 {t("viewComments", { count: commentCount })}
 </button>
 )}
 <CommentForm postId={post.id} onSuccess={handleNewComment} />
 </div>
 )}
 </div>
 );
});
